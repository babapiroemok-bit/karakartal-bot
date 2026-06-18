const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('teslimat-tamamla')
    .setDescription('Üstlendiğin teslimatı tamamlar')
    .addIntegerOption(opt => opt.setName('id').setDescription('Teslimat ID\'si').setRequired(true)),
  async execute(interaction, db, client) {
    const id = interaction.options.getInteger('id');
    const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ? AND guild_id = ?').get(id, interaction.guild.id);
    if (!delivery) return interaction.reply({ content: `❌ ID **${id}** ile teslimat bulunamadı.`, ephemeral: true });
    if (delivery.status !== 'active') return interaction.reply({ content: '❌ Bu teslimat aktif değil.', ephemeral: true });
    if (delivery.driver_id !== interaction.user.id) return interaction.reply({ content: '❌ Bu teslimat sana ait değil.', ephemeral: true });

    db.prepare('UPDATE deliveries SET status = ?, completed_at = ? WHERE id = ?').run('completed', new Date().toISOString(), id);

    let userRow = db.prepare('SELECT * FROM users WHERE user_id = ? AND guild_id = ?').get(interaction.user.id, interaction.guild.id);
    if (!userRow) {
      db.prepare('INSERT INTO users (user_id, guild_id) VALUES (?, ?)').run(interaction.user.id, interaction.guild.id);
      userRow = { balance: 0 };
    }
    db.prepare('UPDATE users SET balance = balance + ? WHERE user_id = ? AND guild_id = ?').run(delivery.reward, interaction.user.id, interaction.guild.id);
    db.prepare('UPDATE drivers SET total_deliveries = total_deliveries + 1, total_earned = total_earned + ? WHERE user_id = ?').run(delivery.reward, interaction.user.id);

    const embed = new EmbedBuilder()
      .setColor(0x2ECC71)
      .setTitle('✅ Teslimat Tamamlandı!')
      .addFields(
        { name: '🆔 Teslimat ID', value: `${id}`, inline: true },
        { name: '📍 Güzergah', value: `${delivery.start_loc} → ${delivery.end_loc}`, inline: true },
        { name: '💰 Kazanılan', value: `${delivery.reward} ₺`, inline: true }
      )
      .setDescription(`Tebrikler ${interaction.user}! Bakiyene **${delivery.reward} ₺** eklendi.`)
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
