const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('teslimat-olustur')
    .setDescription('Yeni teslimat ilanı oluşturur (Yetkili)')
    .addStringOption(opt => opt.setName('baslangic').setDescription('Başlangıç konumu').setRequired(true))
    .addStringOption(opt => opt.setName('bitis').setDescription('Bitiş konumu').setRequired(true))
    .addStringOption(opt => opt.setName('yuk').setDescription('Yük türü').setRequired(true))
    .addIntegerOption(opt => opt.setName('ucret').setDescription('Ödeme miktarı (₺)').setRequired(true).setMinValue(1)),
  async execute(interaction, db, client) {
    const hasRole = interaction.member.roles.cache.some(r => r.name === 'Yetkili' || r.name === 'Moderatör');
    if (!hasRole && !interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: '❌ Bu komutu kullanmak için **Yetkili** rolüne sahip olmalısın.', ephemeral: true });
    }
    const baslangic = interaction.options.getString('baslangic');
    const bitis = interaction.options.getString('bitis');
    const yuk = interaction.options.getString('yuk');
    const ucret = interaction.options.getInteger('ucret');

    const result = db.prepare('INSERT INTO deliveries (guild_id, start_loc, end_loc, cargo, reward, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(interaction.guild.id, baslangic, bitis, yuk, ucret, new Date().toISOString());

    const embed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle('📦 Yeni Teslimat İlanı')
      .addFields(
        { name: '🆔 ID', value: `${result.lastInsertRowid}`, inline: true },
        { name: '📍 Başlangıç', value: baslangic, inline: true },
        { name: '🏁 Bitiş', value: bitis, inline: true },
        { name: '📦 Yük', value: yuk, inline: true },
        { name: '💰 Ücret', value: `${ucret} ₺`, inline: true },
        { name: '✅ Durum', value: 'Açık', inline: true }
      )
      .setFooter({ text: '🦅 KaraKartal Logistics — /teslimat-al [id] ile al' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
