const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

const pages = [
  {
    title: '📋 Moderasyon Komutları',
    description: [
      '`/ban` — Kullanıcıyı yasakla',
      '`/kick` — Kullanıcıyı at',
      '`/mute` — Kullanıcıyı sustur',
      '`/uyari` — Uyarı ver',
      '`/uyarilar` — Uyarıları listele',
      '`/uyarisil` — Uyarı sil',
    ].join('\n'),
  },
  {
    title: '🚛 Lojistik Komutları',
    description: [
      '`/sofor-kayit` — Şoför ol',
      '`/sofor-profil` — Profilini gör',
      '`/soforler` — Tüm şoförler',
      '`/arac-ekle` — Araç ekle (Admin)',
      '`/arac-listesi` — Araç listesi',
      '`/teslimat-olustur` — Teslimat oluştur',
      '`/teslimat-al` — Teslimat üstlen',
      '`/teslimat-tamamla` — Teslimatı bitir',
      '`/aktif-teslimatlar` — Açık teslimatlar',
      '`/teslimat-gecmis` — Geçmişin',
      '`/bakiye` — Bakiyeni gör',
      '`/siralama` — Bakiye sıralaması',
    ].join('\n'),
  },
  {
    title: '🏆 Leveling | 🎫 Destek | 📊 Genel',
    description: [
      '**Leveling**',
      '`/seviye` — Seviyeni gör',
      '`/liderlik` — XP tablosu',
      '',
      '**Destek**',
      '`/destek` — Ticket aç',
      '',
      '**Genel**',
      '`/durum` — Sunucu istatistikleri',
      '`/yardim` — Bu menü',
    ].join('\n'),
  },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yardim')
    .setDescription('Komut listesini gösterir.'),

  async execute(interaction, db, client) {
    let page = 0;

    const getEmbed = (p) => new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(pages[p].title)
      .setDescription(pages[p].description)
      .setFooter({ text: `🦅 KaraKartal Logistics • Sayfa ${p + 1}/${pages.length}` })
      .setTimestamp();

    const getRow = (p) => new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('yardim_prev').setLabel('◀ Önceki').setStyle(ButtonStyle.Secondary).setDisabled(p === 0),
      new ButtonBuilder().setCustomId('yardim_next').setLabel('Sonraki ▶').setStyle(ButtonStyle.Primary).setDisabled(p === pages.length - 1),
    );

    const msg = await interaction.reply({ embeds: [getEmbed(page)], components: [getRow(page)], fetchReply: true });

    const collector = msg.createMessageComponentCollector({ time: 60000 });

    collector.on('collect', async (btn) => {
      if (btn.user.id !== interaction.user.id) {
        return btn.reply({ content: '❌ Bu menü size ait değil!', ephemeral: true });
      }
      if (btn.customId === 'yardim_prev') page = Math.max(0, page - 1);
      if (btn.customId === 'yardim_next') page = Math.min(pages.length - 1, page + 1);
      await btn.update({ embeds: [getEmbed(page)], components: [getRow(page)] });
    });

    collector.on('end', async () => {
      await interaction.editReply({ components: [] }).catch(() => {});
    });
  },
};
