const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bir kullanıcıyı sunucudan yasaklar')
    .addUserOption(opt => opt.setName('kullanici').setDescription('Yasaklanacak kullanıcı').setRequired(true))
    .addStringOption(opt => opt.setName('sebep').setDescription('Yasaklama sebebi').setRequired(false)),
  async execute(interaction, db, client) {
    const hasRole = interaction.member.roles.cache.some(r => r.name === 'Yetkili' || r.name === 'Moderatör');
    if (!hasRole && !interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ content: '❌ Bu komutu kullanmak için **Yetkili** veya **Moderatör** rolüne sahip olmalısın.', ephemeral: true });
    }
    const target = interaction.options.getMember('kullanici');
    const sebep = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
    if (!target) return interaction.reply({ content: '❌ Kullanıcı bulunamadı.', ephemeral: true });
    if (!target.bannable) return interaction.reply({ content: '❌ Bu kullanıcıyı yasaklayamam (yetkim yok).', ephemeral: true });

    await target.ban({ reason: sebep });

    const embed = new EmbedBuilder()
      .setColor(0xE74C3C)
      .setTitle('🔨 Kullanıcı Yasaklandı')
      .addFields(
        { name: 'Kullanıcı', value: `${target.user.tag}`, inline: true },
        { name: 'Yetkili', value: `${interaction.user.tag}`, inline: true },
        { name: 'Sebep', value: sebep }
      )
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const logChannel = interaction.guild.channels.cache.find(c => c.name === 'yetkili-log');
    if (logChannel) logChannel.send({ embeds: [embed] });
  }
};
