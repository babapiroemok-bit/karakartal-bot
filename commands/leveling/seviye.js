const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('seviye')
    .setDescription('Kendi seviye ve XP bilgilerini gösterir'),
  async execute(interaction, db, client) {
    let row = db.prepare('SELECT * FROM users WHERE user_id = ? AND guild_id = ?').get(interaction.user.id, interaction.guild.id);
    if (!row) {
      db.prepare('INSERT INTO users (user_id, guild_id) VALUES (?, ?)').run(interaction.user.id, interaction.guild.id);
      row = { xp: 0, level: 1, balance: 0 };
    }
    const xpNeeded = Math.floor(row.level * 100 * 1.5);
    const progress = Math.floor((row.xp / xpNeeded) * 20);
    const bar = '█'.repeat(progress) + '░'.repeat(20 - progress);

    const embed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle(`📊 ${interaction.user.username} — Seviye Bilgisi`)
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields(
        { name: '🎖️ Seviye', value: `**${row.level}**`, inline: true },
        { name: '✨ XP', value: `**${row.xp}** / ${xpNeeded}`, inline: true },
        { name: '💰 Bakiye', value: `**${row.balance}** ₺`, inline: true },
        { name: '📈 İlerleme', value: `\`${bar}\` %${Math.floor((row.xp / xpNeeded) * 100)}` }
      )
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
