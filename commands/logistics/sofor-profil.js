const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sofor-profil')
    .setDescription('Şoför profilini gösterir'),
  async execute(interaction, db, client) {
    const driver = db.prepare('SELECT * FROM drivers WHERE user_id = ?').get(interaction.user.id);
    if (!driver) return interaction.reply({ content: '❌ Henüz şoför kaydın yok. `/sofor-kayit` komutunu kullan.', ephemeral: true });

    const user = db.prepare('SELECT * FROM users WHERE user_id = ? AND guild_id = ?').get(interaction.user.id, interaction.guild.id);
    const balance = user ? user.balance : 0;

    const embed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle(`🚛 Şoför Profili — ${driver.full_name}`)
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields(
        { name: '👤 Ad Soyad', value: driver.full_name, inline: true },
        { name: '🚗 Plaka', value: driver.plate, inline: true },
        { name: '📦 Toplam Teslimat', value: `${driver.total_deliveries}`, inline: true },
        { name: '💰 Toplam Kazanç', value: `${driver.total_earned} ₺`, inline: true },
        { name: '💳 Bakiye', value: `${balance} ₺`, inline: true }
      )
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
