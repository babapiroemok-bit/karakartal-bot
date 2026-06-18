const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const pages = [
  {
    title: '📖 Komut Listesi — Sayfa 1/2',
    fields: [
      {
        name: '🛡️ Moderasyon',
        value: '`/ban` — Kullanıcıyı yasakla\n`/kick` — Kullanıcıyı at\n`/mute` — Kullanıcıyı sustur\n`/uyari` — Uyarı ver\n`/uyarilar` — Uyarıları listele\n`/uyarisil` — Uyarı sil'
      },
      {
        name: '⭐ Seviye',
        value: '`/seviye` — Seviye ve XP bilgin\n`/liderlik` — XP sıralaması'
      },
      {
        name: '🚛 Lojistik — Şoför',
        value: '`/sofor-kayit` — Şoför kaydı oluştur\n`/sofor-profil` — Profilini görüntüle\n`/soforler` — Tüm şoförler\n`/arac-ekle` — Araç ekle (Yönetici)\n`/arac-listesi` — Araç filosu'
      }
    ]
  },
  {
    title: '📖 Komut Listesi — Sayfa 2/2',
    fields: [
      {
        name: '📦 Lojistik — Teslimat',
        value: '`/teslimat-olustur` — Teslimat ilanı oluştur\n`/teslimat-al` — Teslimat üstlen\n`/teslimat-tamamla` — Teslimatı tamamla\n`/aktif-teslimatlar` — Aktif ilanlar\n`/teslimat-gecmis` — Geçmiş teslimatlar'
      },
      {
        name: '💰 Ekonomi',
        value: '`/bakiye` — Bakiyeni görüntüle\n`/siralama` — Bakiye sıralaması'
      },
      {
        name: '🎫 Destek & Genel',
        value: '`/destek` — Ticket oluştur\n`/durum` — Sunucu durumu\n`/yardim` — Bu menü'
      }
    ]
  }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yardim')
    .setDescription('Tüm komutları listeler'),

  async execute(interaction, db, client) {
    const embed = buildPage(0);
    const row = buildRow(0);
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: false });
  },

  async handleButton(interaction) {
    const currentPage = interaction.message.embeds[0]?.title?.includes('1/2') ? 0 : 1;
    const newPage = interaction.customId === 'help_next' ? currentPage + 1 : currentPage - 1;
    if (newPage < 0 || newPage >= pages.length) return interaction.deferUpdate();

    const embed = buildPage(newPage);
    const row = buildRow(newPage);
    await interaction.update({ embeds: [embed], components: [row] });
  }
};

function buildPage(index) {
  const page = pages[index];
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(page.title)
    .setFooter({ text: '🦅 KaraKartal Logistics' })
    .setTimestamp();
  page.fields.forEach(f => embed.addFields({ name: f.name, value: f.value }));
  return embed;
}

function buildRow(index) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('help_prev').setLabel('◀ Önceki').setStyle(ButtonStyle.Secondary).setDisabled(index === 0),
    new ButtonBuilder().setCustomId('help_next').setLabel('Sonraki ▶').setStyle(ButtonStyle.Secondary).setDisabled(index === pages.length - 1)
  );
}
