const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sofor-kayit')
    .setDescription('Şoför olarak kayıt ol')
    .addStringOption(opt => opt.setName('ad_soyad').setDescription('Adınız ve soyadınız').setRequired(true))
    .addStringOption(opt => opt.setName('plaka').setDescription('Araç plakası').setRequired(true)),
  async execute(interaction, db, client) {
    const existing = db.prepare('SELECT * FROM drivers WHERE user_id = ?').get(interaction.user.id);
    if (existing) return interaction.reply({ content: '❌ Zaten şoför olarak kayıtlısın.', ephemeral: true });

    const adSoyad = interaction.options.getString('ad_soyad');
    const plaka = interaction.options.getString('plaka').toUpperCase();

    db.prepare('INSERT INTO drivers (user_id, guild_id, full_name, plate) VALUES (?, ?, ?, ?)')
      .run(interaction.user.id, interaction.guild.id, adSoyad, plaka);

    const embed = new EmbedBuilder()
      .setColor(0x2ECC71)
      .setTitle('🚛 Şoför Kaydı Oluşturuldu')
      .addFields(
        { name: '👤 Ad Soyad', value: adSoyad, inline: true },
        { name: '🚗 Plaka', value: plaka, inline: true },
        { name: '📦 Teslimat', value: '0', inline: true }
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
