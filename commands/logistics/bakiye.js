const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bakiye')
    .setDescription('Bakiyeni görüntüler.'),

  async execute(interaction, db, client) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    let user = db.prepare('SELECT * FROM users WHERE user_id = ? AND guild_id = ?').get(userId, guildId);
    if (!user) {
      db.prepare('INSERT INTO users (user_id, guild_id) VALUES (?, ?)').run(userId, guildId);
      user = db.prepare('SELECT * FROM users WHERE user_id = ? AND guild_id = ?').get(userId, guildId);
    }

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle('💰 Bakiye')
      .setDescription(`${interaction.user} hesabınızda **₺${user.balance}** bulunuyor.`)
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
