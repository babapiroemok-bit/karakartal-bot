const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uyarilar')
    .setDescription('Bir kullanıcının uyarılarını listeler')
    .addUserOption(opt => opt.setName('kullanici').setDescription('Uyarıları görüntülenecek kullanıcı').setRequired(true)),
  async execute(interaction, db, client) {
    const hasRole = interaction.member.roles.cache.some(r => r.name === 'Yetkili' || r.name === 'Moderatör');
    if (!hasRole && !interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: '❌ Bu komutu kullanmak için **Yetkili** veya **Moderatör** rolüne sahip olmalısın.', ephemeral: true });
    }
    const target = interaction.options.getUser('kullanici');
    const warnings = db.prepare('SELECT * FROM warnings WHERE user_id = ? AND guild_id = ? ORDER BY id DESC').all(target.id, interaction.guild.id);

    const embed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle(`⚠️ ${target.tag} — Uyarı Listesi`)
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    if (warnings.length === 0) {
      embed.setDescription('Bu kullanıcının hiç uyarısı yok.');
    } else {
      warnings.forEach(w => {
        const mod = interaction.guild.members.cache.get(w.moderator_id);
        embed.addFields({
          name: `#${w.id} — ${new Date(w.timestamp).toLocaleDateString('tr-TR')}`,
          value: `**Sebep:** ${w.reason}\n**Yetkili:** ${mod ? mod.user.tag : w.moderator_id}`
        });
      });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
