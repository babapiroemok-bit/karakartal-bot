const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const YETKILİ_ROLLER = ['1515090088265125889', '1515628992269652109'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kullanıcıyı sunucudan atar.')
    .addUserOption(o => o.setName('kullanici').setDescription('Atılacak kullanıcı').setRequired(true))
    .addStringOption(o => o.setName('sebep').setDescription('Atılma sebebi').setRequired(false)),

  async execute(interaction, db, client) {
    const yetkili = interaction.member.roles.cache.some(r => YETKILİ_ROLLER.includes(r.id));
    if (!yetkili) return interaction.reply({ content: '❌ Bu komutu kullanma yetkiniz yok!', ephemeral: true });

    const hedef = interaction.options.getUser('kullanici');
    const sebep = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
    const member = await interaction.guild.members.fetch(hedef.id).catch(() => null);
    if (!member) return interaction.reply({ content: '❌ Kullanıcı bulunamadı!', ephemeral: true });

    await member.kick(sebep);

    const logEmbed = new EmbedBuilder()
      .setColor(0xe74c3c).setTitle('👢 Kullanıcı Atıldı')
      .addFields(
        { name: 'Yetkili', value: `${interaction.user}`, inline: true },
        { name: 'Hedef', value: `${hedef}`, inline: true },
        { name: 'Sebep', value: sebep },
        { name: 'Tarih', value: new Date().toLocaleString('tr-TR') },
      )
      .setFooter({ text: '🦅 KaraKartal Logistics' }).setTimestamp();

    const logCh = interaction.guild.channels.cache.find(c => c.name === 'yetkili-log');
    if (logCh) await logCh.send({ embeds: [logEmbed] });

    await interaction.reply({ embeds: [new EmbedBuilder().setColor(0xe74c3c).setTitle('✅ Kullanıcı atıldı').setDescription(`${hedef.tag} sunucudan atıldı.\nSebep: ${sebep}`).setFooter({ text: '🦅 KaraKartal Logistics' }).setTimestamp()] });
  },
};
