const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bakiye')
    .setDescription('Mevcut bakiyeni gösterir'),
  async execute(interaction, db, client) {
    let row = db.prepare('SELECT * FROM users WHERE user_id = ? AND guild_id = ?').get(interaction.user.id, interaction.guild.id);
    if (!row) {
      db.prepare('INSERT INTO users (user_id, guild_id) VALUES (?, ?)').run(interaction.user.id, interaction.guild.id);
      row = { balance: 0 };
    }

    const embed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle('💰 Bakiye')
      .setDescription(`${interaction.user}, mevcut bakiyen: **${row.balance} ₺**`)
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
