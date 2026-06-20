const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('teslimat-gecmis')
    .setDescription('Tamamladığın teslimatları listeler.'),

  async execute(interaction, db, client) {
    const deliveries = db.prepare("SELECT * FROM deliveries WHERE driver_id = ? AND status = 'completed' ORDER BY completed_at DESC LIMIT 20").all(interaction.user.id);

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('📋 Teslimat Geçmişim')
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    if (deliveries.length === 0) {
      embed.setDescription('Henüz tamamlanmış teslimatınız yok.');
    } else {
      for (const d of deliveries) {
        embed.addFields({
          name: `#${d.id} — ${d.start_loc} → ${d.end_loc}`,
          value: `Yük: ${d.cargo} | Kazanç: ₺${d.reward} | Tarih: ${new Date(d.completed_at).toLocaleDateString('tr-TR')}`,
        });
      }
    }

    await interaction.reply({ embeds: [embed] });
  },
};
