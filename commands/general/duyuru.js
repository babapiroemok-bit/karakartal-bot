const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const renkler = {
  'Kırmızı': 0xe74c3c,
  'Turuncu': 0xe67e22,
  'Sarı': 0xf1c40f,
  'Yeşil': 0x2ecc71,
  'Açık Yeşil': 0x1abc9c,
  'Mavi': 0x3498db,
  'Koyu Mavi': 0x2980b9,
  'Mor': 0x9b59b6,
  'Koyu Mor': 0x8e44ad,
  'Pembe': 0xe91e8c,
  'Beyaz': 0xffffff,
  'Siyah': 0x23272a,
  'Gri': 0x95a5a6,
  'Koyu Gri': 0x7f8c8d,
  'Altın': 0xf39c12,
  'Turkuaz': 0x00bcd4,
  'Lacivert': 0x1a237e,
  'Bordo': 0xb71c1c,
  'Bej': 0xf5f0e8,
  'Gece Mavisi': 0x0d1b2a,
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('duyuru')
    .setDescription('Embed duyuru gönderir.')
    .addStringOption(o =>
      o.setName('baslik').setDescription('Duyuru başlığı').setRequired(true)
    )
    .addStringOption(o =>
      o.setName('mesaj').setDescription('Duyuru mesajı').setRequired(true)
    )
    .addStringOption(o =>
      o.setName('renk')
        .setDescription('Embed rengi')
        .setRequired(false)
        .addChoices(
          ...Object.keys(renkler).map(name => ({ name, value: name }))
        )
    )
    .addChannelOption(o =>
      o.setName('kanal').setDescription('Göndereceğin kanal (boş bırakırsan mevcut kanal)').setRequired(false)
    ),

  async execute(interaction, db, client) {
    const yetkili = interaction.member.roles.cache.some(r => ['Yetkili', 'Moderator'].includes(r.name))
      || interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!yetkili) return interaction.reply({ content: '❌ Bu komutu kullanma yetkiniz yok!', ephemeral: true });

    const baslik = interaction.options.getString('baslik');
    const mesaj = interaction.options.getString('mesaj');
    const renkAdi = interaction.options.getString('renk') || 'Turuncu';
    const kanal = interaction.options.getChannel('kanal') || interaction.channel;

    const renk = renkler[renkAdi] ?? 0xe67e22;

    const embed = new EmbedBuilder()
      .setColor(renk)
      .setTitle(`📢 ${baslik}`)
      .setDescription(mesaj)
      .setFooter({ text: `🦅 KaraKartal Logistics • ${interaction.user.username} tarafından` })
      .setTimestamp();

    await kanal.send({ embeds: [embed] });
    await interaction.reply({ content: `✅ Duyuru **#${kanal.name}** kanalına gönderildi.`, ephemeral: true });
  },
};
