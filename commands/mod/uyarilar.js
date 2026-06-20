const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uyarilar')
    .setDescription('Kullanıcının uyarılarını listeler.')
    .addUserOption(o => o.setName('kullanici').setDescription('Uyarıları görülecek kullanıcı').setRequired(true)),

  async execute(interaction, db, client) {
    const hedef = interaction.options.getUser('kullanici');
    const warnings = db.prepare('SELECT * FROM warnings WHERE user_id = ? AND guild_id = ?').all(hedef.id, interaction.guild.id);

    const embed = new EmbedBuilder()
      .setColor(0xf39c12)
      .setTitle(`⚠️ ${hedef.tag} - Uyarılar`)
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    if (warnings.length === 0) {
      embed.setDescription('Bu kullanıcının hiç uyarısı yok.');
    } else {
      for (const w of warnings) {
        const mod = await client.users.fetch(w.moderator_id).catch(() => ({ tag: 'Bilinmiyor' }));
        embed.addFields({ name: `#${w.id} — ${w.reason}`, value: `Yetkili: ${mod.tag}\nTarih: ${new Date(w.timestamp).toLocaleString('tr-TR')}` });
      }
    }

    await interaction.reply({ embeds: [embed] });
  },
};
