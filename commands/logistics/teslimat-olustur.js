const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('teslimat-olustur')
    .setDescription('Yeni teslimat oluşturur.')
    .addStringOption(o => o.setName('baslangic').setDescription('Başlangıç noktası').setRequired(true))
    .addStringOption(o => o.setName('bitis').setDescription('Bitiş noktası').setRequired(true))
    .addStringOption(o => o.setName('yuk').setDescription('Yük türü').setRequired(true))
    .addIntegerOption(o => o.setName('ucret').setDescription('Ücret (₺)').setRequired(true)),

  async execute(interaction, db, client) {
    const baslangic = interaction.options.getString('baslangic');
    const bitis = interaction.options.getString('bitis');
    const yuk = interaction.options.getString('yuk');
    const ucret = interaction.options.getInteger('ucret');

    const result = db.prepare(
      'INSERT INTO deliveries (guild_id, start_loc, end_loc, cargo, reward, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(interaction.guild.id, baslangic, bitis, yuk, ucret, 'open', new Date().toISOString());

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle('📦 Teslimat Oluşturuldu')
      .addFields(
        { name: '🆔 Teslimat ID', value: `#${result.lastInsertRowid}`, inline: true },
        { name: '📍 Başlangıç', value: baslangic, inline: true },
        { name: '🏁 Bitiş', value: bitis, inline: true },
        { name: '📦 Yük', value: yuk, inline: true },
        { name: '💰 Ücret', value: `₺${ucret}`, inline: true },
      )
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
