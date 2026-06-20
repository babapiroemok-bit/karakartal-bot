const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const YETKILİ_ROLLER = ['1515090088265125889', '1515628992269652109'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sofor-sil')
    .setDescription('Kayıtlı bir şoförü sistemden çıkarır. (Yetkili)')
    .addUserOption(o => o.setName('kullanici').setDescription('Silinecek şoför').setRequired(true))
    .addStringOption(o => o.setName('sebep').setDescription('Sebep').setRequired(false)),

  async execute(interaction, db, client) {
    const yetkili = interaction.member.roles.cache.some(r => YETKILİ_ROLLER.includes(r.id));
    if (!yetkili) return interaction.reply({ content: '❌ Bu komutu kullanma yetkiniz yok!', ephemeral: true });

    const hedef = interaction.options.getUser('kullanici');
    const sebep = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

    const sofor = db.prepare('SELECT * FROM drivers WHERE user_id = ?').get(hedef.id);
    if (!sofor) {
      return interaction.reply({ content: `❌ **${hedef.username}** sistemde kayıtlı şoför değil!`, ephemeral: true });
    }

    db.prepare('DELETE FROM drivers WHERE user_id = ?').run(hedef.id);

    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle('🗑️ Şoför Silindi')
      .addFields(
        { name: '👤 Şoför', value: `${hedef}`, inline: true },
        { name: '🪪 Ad Soyad', value: sofor.full_name, inline: true },
        { name: '🚗 Plaka', value: sofor.plate, inline: true },
        { name: '📦 Tamamlanan Teslimat', value: `${sofor.total_deliveries}`, inline: true },
        { name: '💰 Toplam Kazanç', value: `₺${sofor.total_earned}`, inline: true },
        { name: '📝 Sebep', value: sebep },
      )
      .setFooter({ text: `🦅 KaraKartal Logistics • ${interaction.user.username} tarafından` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
