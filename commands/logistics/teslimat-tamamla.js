const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('teslimat-tamamla')
    .setDescription('Üstlendiğin teslimatı tamamlar.')
    .addIntegerOption(o => o.setName('id').setDescription('Teslimat ID').setRequired(true)),

  async execute(interaction, db, client) {
    const id = interaction.options.getInteger('id');
    const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ? AND guild_id = ?').get(id, interaction.guild.id);

    if (!delivery) return interaction.reply({ content: '❌ Teslimat bulunamadı!', ephemeral: true });
    if (delivery.driver_id !== interaction.user.id) return interaction.reply({ content: '❌ Bu teslimat size ait değil!', ephemeral: true });
    if (delivery.status !== 'active') return interaction.reply({ content: '❌ Bu teslimat aktif değil!', ephemeral: true });

    db.prepare('UPDATE deliveries SET status = ?, completed_at = ? WHERE id = ?').run('completed', new Date().toISOString(), id);

    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    // INSERT OR IGNORE — unique constraint crash'ini önler
    db.prepare('INSERT OR IGNORE INTO users (user_id, guild_id) VALUES (?, ?)').run(userId, guildId);
    db.prepare('UPDATE users SET balance = balance + ? WHERE user_id = ? AND guild_id = ?').run(delivery.reward, userId, guildId);
    db.prepare('UPDATE drivers SET total_deliveries = total_deliveries + 1, total_earned = total_earned + ? WHERE user_id = ?').run(delivery.reward, userId);

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle('✅ Teslimat Tamamlandı!')
      .addFields(
        { name: '🆔 Teslimat ID', value: `#${id}`, inline: true },
        { name: '💰 Kazanılan', value: `₺${delivery.reward}`, inline: true },
        { name: '📍 Güzergah', value: `${delivery.start_loc} → ${delivery.end_loc}` },
      )
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
