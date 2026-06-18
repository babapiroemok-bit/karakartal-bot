const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uyarisil')
    .setDescription('Bir kullanıcının uyarısını siler')
    .addUserOption(opt => opt.setName('kullanici').setDescription('Uyarısı silinecek kullanıcı').setRequired(true))
    .addIntegerOption(opt => opt.setName('id').setDescription('Silinecek uyarının ID\'si').setRequired(true)),
  async execute(interaction, db, client) {
    const hasRole = interaction.member.roles.cache.some(r => r.name === 'Yetkili' || r.name === 'Moderatör');
    if (!hasRole && !interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: '❌ Bu komutu kullanmak için **Yetkili** veya **Moderatör** rolüne sahip olmalısın.', ephemeral: true });
    }
    const target = interaction.options.getUser('kullanici');
    const id = interaction.options.getInteger('id');

    const warning = db.prepare('SELECT * FROM warnings WHERE id = ? AND user_id = ? AND guild_id = ?').get(id, target.id, interaction.guild.id);
    if (!warning) return interaction.reply({ content: `❌ ID **${id}** ile eşleşen uyarı bulunamadı.`, ephemeral: true });

    db.prepare('DELETE FROM warnings WHERE id = ?').run(id);

    const embed = new EmbedBuilder()
      .setColor(0x2ECC71)
      .setTitle('🗑️ Uyarı Silindi')
      .addFields(
        { name: 'Kullanıcı', value: `${target.tag}`, inline: true },
        { name: 'Silinen Uyarı ID', value: `${id}`, inline: true },
        { name: 'İşlemi Yapan', value: `${interaction.user.tag}`, inline: true }
      )
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
