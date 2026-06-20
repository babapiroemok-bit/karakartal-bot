const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const YETKILİ_ROLLER = ['1515090088265125889', '1515628992269652109'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uyari')
    .setDescription('Kullanıcıya uyarı verir.')
    .addUserOption(o => o.setName('kullanici').setDescription('Uyarılacak kullanıcı').setRequired(true))
    .addStringOption(o => o.setName('sebep').setDescription('Uyarı sebebi').setRequired(true)),

  async execute(interaction, db, client) {
    const yetkili = interaction.member.roles.cache.some(r => YETKILİ_ROLLER.includes(r.id));
    if (!yetkili) return interaction.reply({ content: '❌ Bu komutu kullanma yetkiniz yok!', ephemeral: true });

    const hedef = interaction.options.getUser('kullanici');
    const sebep = interaction.options.getString('sebep');

    db.prepare('INSERT INTO warnings (user_id, guild_id, reason, moderator_id, timestamp) VALUES (?, ?, ?, ?, ?)')
      .run(hedef.id, interaction.guild.id, sebep, interaction.user.id, new Date().toISOString());

    const logEmbed = new EmbedBuilder()
      .setColor(0xf39c12).setTitle('⚠️ Kullanıcı Uyarıldı')
      .addFields(
        { name: 'Yetkili', value: `${interaction.user}`, inline: true },
        { name: 'Hedef', value: `${hedef}`, inline: true },
        { name: 'Sebep', value: sebep },
        { name: 'Tarih', value: new Date().toLocaleString('tr-TR') },
      )
      .setFooter({ text: '🦅 KaraKartal Logistics' }).setTimestamp();

    const logCh = interaction.guild.channels.cache.find(c => c.name === 'yetkili-log');
    if (logCh) await logCh.send({ embeds: [logEmbed] });

    await interaction.reply({ embeds: [new EmbedBuilder().setColor(0xf39c12).setTitle('✅ Uyarı verildi').setDescription(`${hedef.tag} uyarıldı.\nSebep: ${sebep}`).setFooter({ text: '🦅 KaraKartal Logistics' }).setTimestamp()] });
  },
};
