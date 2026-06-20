const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Kullanıcıyı susturur.')
    .addUserOption(o => o.setName('kullanici').setDescription('Susturulacak kullanıcı').setRequired(true))
    .addIntegerOption(o => o.setName('sure').setDescription('Süre (dakika)').setRequired(true))
    .addStringOption(o => o.setName('sebep').setDescription('Susturma sebebi').setRequired(false)),

  async execute(interaction, db, client) {
    const yetkili = interaction.member.roles.cache.some(r => ['Yetkili', 'Moderator'].includes(r.name));
    if (!yetkili) return interaction.reply({ content: '❌ Bu komutu kullanma yetkiniz yok!', ephemeral: true });

    const hedef = interaction.options.getUser('kullanici');
    const sure = interaction.options.getInteger('sure');
    const sebep = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
    const member = await interaction.guild.members.fetch(hedef.id).catch(() => null);
    if (!member) return interaction.reply({ content: '❌ Kullanıcı bulunamadı!', ephemeral: true });

    await member.timeout(sure * 60000, sebep);

    const logEmbed = new EmbedBuilder()
      .setColor(0xf39c12)
      .setTitle('🔇 Kullanıcı Susturuldu')
      .addFields(
        { name: 'Yetkili', value: `${interaction.user}`, inline: true },
        { name: 'Hedef', value: `${hedef}`, inline: true },
        { name: 'Süre', value: `${sure} dakika`, inline: true },
        { name: 'Sebep', value: sebep },
        { name: 'Tarih', value: new Date().toLocaleString('tr-TR') },
      )
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    const logCh = interaction.guild.channels.cache.find(c => c.name === 'yetkili-log');
    if (logCh) await logCh.send({ embeds: [logEmbed] });

    await interaction.reply({ embeds: [new EmbedBuilder().setColor(0xf39c12).setTitle('✅ Kullanıcı susturuldu').setDescription(`${hedef.tag} ${sure} dakika susturuldu.\nSebep: ${sebep}`).setFooter({ text: '🦅 KaraKartal Logistics' }).setTimestamp()] });
  },
};
