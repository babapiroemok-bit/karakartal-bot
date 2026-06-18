const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('siralama')
    .setDescription('Bakiye sıralamasını gösterir (Top 10)'),
  async execute(interaction, db, client) {
    const top = db.prepare('SELECT * FROM users WHERE guild_id = ? ORDER BY balance DESC LIMIT 10').all(interaction.guild.id);
    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

    const embed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle('💰 Bakiye Sıralaması')
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    if (top.length === 0) {
      embed.setDescription('Henüz hiç veri yok.');
    } else {
      const lines = top.map((row, i) => {
        const member = interaction.guild.members.cache.get(row.user_id);
        const name = member ? member.user.username : `Kullanıcı (${row.user_id})`;
        return `${medals[i]} **${name}** — ${row.balance} ₺`;
      });
      embed.setDescription(lines.join('\n'));
    }

    await interaction.reply({ embeds: [embed] });
  }
};
