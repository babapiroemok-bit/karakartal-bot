const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sofor-profil')
    .setDescription('Şoför profilini görüntüler.'),

  async execute(interaction, db, client) {
    const driver = db.prepare('SELECT * FROM drivers WHERE user_id = ?').get(interaction.user.id);
    if (!driver) return interaction.reply({ content: '❌ Şoför kaydınız yok! `/sofor-kayit` ile kayıt olun.', ephemeral: true });

    const user = db.prepare('SELECT * FROM users WHERE user_id = ? AND guild_id = ?').get(interaction.user.id, interaction.guild.id);
    const balance = user ? user.balance : 0;

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`🚛 ${driver.full_name} — Şoför Profili`)
      .addFields(
        { name: '🚗 Plaka', value: driver.plate, inline: true },
        { name: '📦 Toplam Teslimat', value: `${driver.total_deliveries}`, inline: true },
        { name: '💵 Toplam Kazanç', value: `₺${driver.total_earned}`, inline: true },
        { name: '💰 Bakiye', value: `₺${balance}`, inline: true },
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
