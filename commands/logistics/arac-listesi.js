const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('arac-listesi')
    .setDescription('Tüm araçları listeler.'),

  async execute(interaction, db, client) {
    const vehicles = db.prepare('SELECT * FROM vehicles WHERE guild_id = ?').all(interaction.guild.id);

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('🚗 Araç Listesi')
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    if (vehicles.length === 0) {
      embed.setDescription('Henüz kayıtlı araç yok.');
    } else {
      embed.setDescription(vehicles.map((v, i) => `**${i + 1}.** \`${v.plate}\` — ${v.model} | Kapasite: ${v.capacity}`).join('\n'));
    }

    await interaction.reply({ embeds: [embed] });
  },
};
