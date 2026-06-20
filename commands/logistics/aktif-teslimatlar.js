const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('aktif-teslimatlar')
    .setDescription('Açık ve aktif teslimatları listeler.'),

  async execute(interaction, db, client) {
    const deliveries = db.prepare("SELECT * FROM deliveries WHERE guild_id = ? AND (status = 'open' OR status = 'active')").all(interaction.guild.id);

    const embed = new EmbedBuilder()
      .setColor(0xe67e22)
      .setTitle('📦 Aktif Teslimatlar')
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    if (deliveries.length === 0) {
      embed.setDescription('Şu an aktif teslimat yok.');
    } else {
      for (const d of deliveries) {
        const statusLabel = d.status === 'open' ? '🟢 Açık' : '🔵 Aktif';
        embed.addFields({
          name: `#${d.id} — ${d.start_loc} → ${d.end_loc}`,
          value: `Yük: ${d.cargo} | Ücret: ₺${d.reward} | Durum: ${statusLabel}`,
        });
      }
    }

    await interaction.reply({ embeds: [embed] });
  },
};
