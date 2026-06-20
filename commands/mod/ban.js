const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const YETKILİ_ROLLER = ['1515090088265125889', '1515628992269652109'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Kullanıcıyı sunucudan yasaklar.')
    .addUserOption(o => o.setName('kullanici').setDescription('Yasaklanacak kullanıcı').setRequired(true))
    .addStringOption(o => o.setName('sebep').setDescription('Yasak sebebi').setRequired(false)),

  async execute(interaction, db, client) {
    const yetkili = interaction.member.roles.cache.some(r => YETKILİ_ROLLER.includes(r.id));
    if (!yetkili) return interaction.reply({ content: '❌ Bu komutu kullanma yetkiniz yok!', ephemeral: true });

    const hedef = interaction.options.getUser('kullanici');
    const sebep = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
    const member = await interaction.guild.members.fetch(hedef.id).catch(() => null);
    if (!member) return interaction.reply({ content: '❌ Kullanıcı bulunamadı!', ephemeral: true });

    await member.ban({ reason: sebep });

    const logEmbed = new EmbedBuilder()
      .setColor(0xe74c3c).setTitle('🔨 Kullanıcı Yasaklandı')
      .addFields(
        { name: 'Yetkili', value: `${interaction.user}`, inline: true },
        { name: 'Hedef', value: `${hedef}`, inline: true },
        { name: 'Sebep', value: sebep },
        { name: 'Tarih', value: new Date().toLocaleString('tr-TR') },
      )
      .setFooter({ text: '🦅 KaraKartal Logistics' }).setTimestamp();

    const logCh = interaction.guild.channels.cache.find(c => c.name === 'yetkili-log');
    if (logCh) await logCh.send({ embeds: [logEmbed] });

    await interaction.reply({ embeds: [new EmbedBuilder().setColor(0xe74c3c).setTitle('✅ Kullanıcı yasaklandı').setDescription(`${hedef.tag} sunucudan yasaklandı.\nSebep: ${sebep}`).setFooter({ text: '🦅 KaraKartal Logistics' }).setTimestamp()] });
  },
};
