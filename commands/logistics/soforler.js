const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('soforler')
    .setDescription('Tüm kayıtlı şoförleri listeler'),
  async execute(interaction, db, client) {
    const drivers = db.prepare('SELECT * FROM drivers WHERE guild_id = ? ORDER BY total_deliveries DESC').all(interaction.guild.id);

    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle('🚛 Kayıtlı Şoförler')
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    if (drivers.length === 0) {
      embed.setDescription('Henüz kayıtlı şoför yok.');
    } else {
      const lines = drivers.map((d, i) => `**${i + 1}.** ${d.full_name} | 🚗 ${d.plate} | 📦 ${d.total_deliveries} teslimat | 💰 ${d.total_earned} ₺`);
      embed.setDescription(lines.join('\n'));
    }

    await interaction.reply({ embeds: [embed] });
  }
};
