const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('liderlik')
    .setDescription('XP liderlik tablosunu gösterir.'),

  async execute(interaction, db, client) {
    const top10 = db.prepare('SELECT * FROM users WHERE guild_id = ? ORDER BY level DESC, xp DESC LIMIT 10').all(interaction.guild.id);

    const medals = ['🥇', '🥈', '🥉'];
    let desc = '';

    for (let i = 0; i < top10.length; i++) {
      const u = top10[i];
      const fetched = await client.users.fetch(u.user_id).catch(() => null);
      const name = fetched ? fetched.username : 'Bilinmiyor';
      const medal = medals[i] || `**${i + 1}.**`;
      desc += `${medal} **${name}** — Seviye ${u.level} | ${u.xp} XP\n`;
    }

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle('🏆 XP Liderlik Tablosu')
      .setDescription(desc || 'Henüz veri yok.')
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
