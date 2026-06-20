const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const YETKILİ_ROLLER = ['1515090088265125889', '1515628992269652109'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('teslimat-iptal')
    .setDescription('Aktif bir teslimatı iptal eder. (Yetkili)')
    .addIntegerOption(o => o.setName('id').setDescription('Teslimat ID').setRequired(true))
    .addStringOption(o => o.setName('sebep').setDescription('İptal sebebi').setRequired(false)),

  async execute(interaction, db, client) {
    const yetkili = interaction.member.roles.cache.some(r => YETKILİ_ROLLER.includes(r.id));
    if (!yetkili) return interaction.reply({ content: '❌ Bu komutu kullanma yetkiniz yok!', ephemeral: true });

    const id = interaction.options.getInteger('id');
    const sebep = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

    const teslimat = db.prepare('SELECT * FROM deliveries WHERE id = ? AND guild_id = ?').get(id, interaction.guild.id);
    if (!teslimat) return interaction.reply({ content: `❌ #${id} numaralı teslimat bulunamadı!`, ephemeral: true });
    if (teslimat.status === 'completed') return interaction.reply({ content: '❌ Tamamlanmış bir teslimat iptal edilemez!', ephemeral: true });
    if (teslimat.status === 'cancelled') return interaction.reply({ content: '❌ Bu teslimat zaten iptal edilmiş!', ephemeral: true });

    db.prepare("UPDATE deliveries SET status = 'cancelled' WHERE id = ?").run(id);

    let soforBilgi = 'Kimse üstlenmemişti';
    if (teslimat.driver_id) {
      const sofor = db.prepare('SELECT full_name FROM drivers WHERE user_id = ?').get(teslimat.driver_id);
      soforBilgi = sofor ? sofor.full_name : `<@${teslimat.driver_id}>`;
    }

    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle('🚫 Teslimat İptal Edildi')
      .addFields(
        { name: '🆔 Teslimat ID', value: `#${id}`, inline: true },
        { name: '📍 Güzergah', value: `${teslimat.start_loc} → ${teslimat.end_loc}`, inline: true },
        { name: '👤 Şoför', value: soforBilgi, inline: true },
        { name: '💰 Ücret', value: `₺${teslimat.reward}`, inline: true },
        { name: '📝 Sebep', value: sebep },
      )
      .setFooter({ text: `🦅 KaraKartal Logistics • ${interaction.user.username} tarafından` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
