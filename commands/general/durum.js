const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('durum')
    .setDescription('Sunucunun genel durumunu gösterir'),
  async execute(interaction, db, client) {
    const activeDeliveries = db.prepare('SELECT COUNT(*) as cnt FROM deliveries WHERE guild_id = ? AND status IN (\'open\', \'active\')').get(interaction.guild.id);
    const totalDrivers = db.prepare('SELECT COUNT(*) as cnt FROM drivers WHERE guild_id = ?').get(interaction.guild.id);
    const topDriver = db.prepare('SELECT * FROM drivers WHERE guild_id = ? ORDER BY total_deliveries DESC LIMIT 1').get(interaction.guild.id);
    const openTickets = db.prepare('SELECT COUNT(*) as cnt FROM tickets WHERE guild_id = ? AND status = \'open\'').get(interaction.guild.id);

    const embed = new EmbedBuilder()
      .setColor(0xE67E22)
      .setTitle('🦅 KaraKartal Logistics — Sunucu Durumu')
      .setThumbnail(interaction.guild.iconURL())
      .addFields(
        { name: '👥 Toplam Üye', value: `${interaction.guild.memberCount}`, inline: true },
        { name: '🚛 Kayıtlı Şoför', value: `${totalDrivers.cnt}`, inline: true },
        { name: '📦 Aktif Teslimat', value: `${activeDeliveries.cnt}`, inline: true },
        { name: '🎫 Açık Ticket', value: `${openTickets.cnt}`, inline: true },
      )
      .setFooter({ text: '🦅 KaraKartal Logistics | Lojistik & Roleplay' })
      .setTimestamp();

    if (topDriver) {
      const topMember = interaction.guild.members.cache.get(topDriver.user_id);
      embed.addFields({ name: '🏆 En İyi Şoför', value: `${topMember ? topMember.user.username : topDriver.full_name} — ${topDriver.total_deliveries} teslimat` });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
