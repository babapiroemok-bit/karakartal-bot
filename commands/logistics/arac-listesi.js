const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('arac-listesi')
    .setDescription('Araç filosunu listeler'),
  async execute(interaction, db, client) {
    const vehicles = db.prepare('SELECT * FROM vehicles WHERE guild_id = ?').all(interaction.guild.id);

    const embed = new EmbedBuilder()
      .setColor(0x1ABC9C)
      .setTitle('🚗 Araç Filosu')
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    if (vehicles.length === 0) {
      embed.setDescription('Henüz kayıtlı araç yok. `/arac-ekle` komutu ile araç ekleyin.');
    } else {
      const lines = vehicles.map(v => `**#${v.id}** — ${v.plate} | ${v.model} | Kapasite: ${v.capacity}`);
      embed.setDescription(lines.join('\n'));
    }

    await interaction.reply({ embeds: [embed] });
  }
};
