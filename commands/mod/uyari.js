const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uyari')
    .setDescription('Bir kullanıcıya uyarı verir')
    .addUserOption(opt => opt.setName('kullanici').setDescription('Uyarılacak kullanıcı').setRequired(true))
    .addStringOption(opt => opt.setName('sebep').setDescription('Uyarı sebebi').setRequired(true)),
  async execute(interaction, db, client) {
    const hasRole = interaction.member.roles.cache.some(r => r.name === 'Yetkili' || r.name === 'Moderatör');
    if (!hasRole && !interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: '❌ Bu komutu kullanmak için **Yetkili** veya **Moderatör** rolüne sahip olmalısın.', ephemeral: true });
    }
    const target = interaction.options.getUser('kullanici');
    const sebep = interaction.options.getString('sebep');

    db.prepare('INSERT INTO warnings (user_id, guild_id, reason, moderator_id, timestamp) VALUES (?, ?, ?, ?, ?)')
      .run(target.id, interaction.guild.id, sebep, interaction.user.id, new Date().toISOString());

    const count = db.prepare('SELECT COUNT(*) as cnt FROM warnings WHERE user_id = ? AND guild_id = ?').get(target.id, interaction.guild.id);

    const embed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle('⚠️ Uyarı Verildi')
      .addFields(
        { name: 'Kullanıcı', value: `${target.tag}`, inline: true },
        { name: 'Yetkili', value: `${interaction.user.tag}`, inline: true },
        { name: 'Toplam Uyarı', value: `${count.cnt}`, inline: true },
        { name: 'Sebep', value: sebep }
      )
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const logChannel = interaction.guild.channels.cache.find(c => c.name === 'yetkili-log');
    if (logChannel) logChannel.send({ embeds: [embed] });
  }
};
