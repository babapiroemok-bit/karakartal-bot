const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const YETKILİ_ROLLER = ['1515090088265125889', '1515628992269652109'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uyarisil')
    .setDescription('Kullanıcının uyarısını siler.')
    .addUserOption(o => o.setName('kullanici').setDescription('Kullanıcı').setRequired(true))
    .addIntegerOption(o => o.setName('id').setDescription('Uyarı ID').setRequired(true)),

  async execute(interaction, db, client) {
    const yetkili = interaction.member.roles.cache.some(r => YETKILİ_ROLLER.includes(r.id));
    if (!yetkili) return interaction.reply({ content: '❌ Bu komutu kullanma yetkiniz yok!', ephemeral: true });

    const hedef = interaction.options.getUser('kullanici');
    const id = interaction.options.getInteger('id');
    const result = db.prepare('DELETE FROM warnings WHERE id = ? AND user_id = ? AND guild_id = ?').run(id, hedef.id, interaction.guild.id);

    if (result.changes === 0) return interaction.reply({ content: '❌ Uyarı bulunamadı!', ephemeral: true });

    await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x2ecc71).setTitle('✅ Uyarı silindi').setDescription(`${hedef.tag} kullanıcısının #${id} numaralı uyarısı silindi.`).setFooter({ text: '🦅 KaraKartal Logistics' }).setTimestamp()] });
  },
};
