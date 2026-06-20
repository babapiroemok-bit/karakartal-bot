const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('soforler')
    .setDescription('Tüm şoförleri listeler.'),

  async execute(interaction, db, client) {
    const drivers = db.prepare('SELECT * FROM drivers WHERE guild_id = ?').all(interaction.guild.id);

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('🚛 Şoför Listesi')
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    if (drivers.length === 0) {
      embed.setDescription('Henüz kayıtlı şoför yok.');
    } else {
      embed.setDescription(drivers.map((d, i) => `**${i + 1}.** ${d.full_name} — Plaka: \`${d.plate}\` | Teslimat: ${d.total_deliveries}`).join('\n'));
    }

    await interaction.reply({ embeds: [embed] });
  },
};
