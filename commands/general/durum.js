const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('durum')
    .setDescription('Sunucu ve lojistik istatistiklerini gösterir.'),

  async execute(interaction, db, client) {
    const openDeliveries = db.prepare("SELECT COUNT(*) as count FROM deliveries WHERE guild_id = ? AND status = 'open'").get(interaction.guild.id);
    const driverCount = db.prepare('SELECT COUNT(*) as count FROM drivers WHERE guild_id = ?').get(interaction.guild.id);
    const topDriver = db.prepare('SELECT * FROM drivers WHERE guild_id = ? ORDER BY total_earned DESC LIMIT 1').get(interaction.guild.id);

    let topDriverName = 'Henüz yok';
    if (topDriver) {
      topDriverName = `${topDriver.full_name} (₺${topDriver.total_earned})`;
    }

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle('📊 KaraKartal Logistics — Sunucu Durumu')
      .addFields(
        { name: '📦 Açık Teslimatlar', value: `${openDeliveries.count}`, inline: true },
        { name: '🚛 Kayıtlı Şoförler', value: `${driverCount.count}`, inline: true },
        { name: '👥 Üye Sayısı', value: `${interaction.guild.memberCount}`, inline: true },
        { name: '🏆 En İyi Şoför', value: topDriverName, inline: false },
      )
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
