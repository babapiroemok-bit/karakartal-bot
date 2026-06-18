const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('aktif-teslimatlar')
    .setDescription('Açık ve aktif teslimatları listeler'),
  async execute(interaction, db, client) {
    const deliveries = db.prepare('SELECT * FROM deliveries WHERE guild_id = ? AND status IN (\'open\', \'active\') ORDER BY id DESC').all(interaction.guild.id);

    const embed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle('📦 Aktif Teslimatlar')
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    if (deliveries.length === 0) {
      embed.setDescription('Şu an aktif teslimat bulunmuyor.');
    } else {
      deliveries.forEach(d => {
        const statusEmoji = d.status === 'open' ? '🟢 Açık' : '🟡 Devam Ediyor';
        const driverText = d.driver_id ? `<@${d.driver_id}>` : 'Alınmadı';
        embed.addFields({
          name: `#${d.id} — ${d.start_loc} → ${d.end_loc}`,
          value: `📦 ${d.cargo} | 💰 ${d.reward} ₺ | ${statusEmoji} | 🚛 ${driverText}`
        });
      });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
