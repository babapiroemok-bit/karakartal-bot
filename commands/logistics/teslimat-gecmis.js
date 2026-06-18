const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('teslimat-gecmis')
    .setDescription('Tamamladığın teslimatların geçmişini gösterir'),
  async execute(interaction, db, client) {
    const deliveries = db.prepare('SELECT * FROM deliveries WHERE driver_id = ? AND guild_id = ? AND status = \'completed\' ORDER BY id DESC LIMIT 10').all(interaction.user.id, interaction.guild.id);

    const embed = new EmbedBuilder()
      .setColor(0x95A5A6)
      .setTitle(`📋 ${interaction.user.username} — Teslimat Geçmişi`)
      .setFooter({ text: '🦅 KaraKartal Logistics — Son 10 teslimat' })
      .setTimestamp();

    if (deliveries.length === 0) {
      embed.setDescription('Henüz tamamlanmış teslimatın yok.');
    } else {
      const lines = deliveries.map(d => `**#${d.id}** ${d.start_loc} → ${d.end_loc} | 📦 ${d.cargo} | 💰 ${d.reward} ₺`);
      embed.setDescription(lines.join('\n'));
    }

    await interaction.reply({ embeds: [embed] });
  }
};
