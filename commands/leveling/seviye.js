const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('seviye')
    .setDescription('Seviyeni ve XP durumunu gösterir.'),

  async execute(interaction, db, client) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    let user = db.prepare('SELECT * FROM users WHERE user_id = ? AND guild_id = ?').get(userId, guildId);
    if (!user) {
      db.prepare('INSERT INTO users (user_id, guild_id) VALUES (?, ?)').run(userId, guildId);
      user = db.prepare('SELECT * FROM users WHERE user_id = ? AND guild_id = ?').get(userId, guildId);
    }

    const xpNeeded = Math.floor(user.level * 100 * 1.5);

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle(`📊 ${interaction.user.username} — Seviye Bilgisi`)
      .addFields(
        { name: '🏆 Seviye', value: `${user.level}`, inline: true },
        { name: '✨ XP', value: `${user.xp} / ${xpNeeded}`, inline: true },
        { name: '💰 Bakiye', value: `₺${user.balance}`, inline: true },
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
