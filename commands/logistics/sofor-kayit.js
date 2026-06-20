const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sofor-kayit')
    .setDescription('Şoför olarak kayıt olur.')
    .addStringOption(o => o.setName('ad_soyad').setDescription('Adınız ve soyadınız').setRequired(true))
    .addStringOption(o => o.setName('plaka').setDescription('Araç plakası').setRequired(true)),

  async execute(interaction, db, client) {
    const adSoyad = interaction.options.getString('ad_soyad');
    const plaka = interaction.options.getString('plaka');
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    const mevcut = db.prepare('SELECT * FROM drivers WHERE user_id = ?').get(userId);
    if (mevcut) return interaction.reply({ content: '❌ Zaten şoför olarak kayıtlısınız!', ephemeral: true });

    db.prepare('INSERT INTO drivers (user_id, guild_id, full_name, plate) VALUES (?, ?, ?, ?)').run(userId, guildId, adSoyad, plaka);

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle('✅ Şoför Kaydı Başarılı')
      .addFields(
        { name: '👤 Ad Soyad', value: adSoyad, inline: true },
        { name: '🚗 Plaka', value: plaka, inline: true },
      )
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
