const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Bir kullanıcıyı susturur (timeout)')
    .addUserOption(opt => opt.setName('kullanici').setDescription('Susturulacak kullanıcı').setRequired(true))
    .addIntegerOption(opt => opt.setName('sure').setDescription('Süre (dakika)').setRequired(true).setMinValue(1).setMaxValue(10080))
    .addStringOption(opt => opt.setName('sebep').setDescription('Susturma sebebi').setRequired(false)),
  async execute(interaction, db, client) {
    const hasRole = interaction.member.roles.cache.some(r => r.name === 'Yetkili' || r.name === 'Moderatör');
    if (!hasRole && !interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: '❌ Bu komutu kullanmak için **Yetkili** veya **Moderatör** rolüne sahip olmalısın.', ephemeral: true });
    }
    const target = interaction.options.getMember('kullanici');
    const sure = interaction.options.getInteger('sure');
    const sebep = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
    if (!target) return interaction.reply({ content: '❌ Kullanıcı bulunamadı.', ephemeral: true });

    await target.timeout(sure * 60 * 1000, sebep);

    const embed = new EmbedBuilder()
      .setColor(0xF39C12)
      .setTitle('🔇 Kullanıcı Susturuldu')
      .addFields(
        { name: 'Kullanıcı', value: `${target.user.tag}`, inline: true },
        { name: 'Yetkili', value: `${interaction.user.tag}`, inline: true },
        { name: 'Süre', value: `${sure} dakika`, inline: true },
        { name: 'Sebep', value: sebep }
      )
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const logChannel = interaction.guild.channels.cache.find(c => c.name === 'yetkili-log');
    if (logChannel) logChannel.send({ embeds: [embed] });
  }
};
