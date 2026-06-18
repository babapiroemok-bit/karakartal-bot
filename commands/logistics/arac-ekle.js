const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('arac-ekle')
    .setDescription('Araç filosuna araç ekler (Yönetici)')
    .addStringOption(opt => opt.setName('plaka').setDescription('Araç plakası').setRequired(true))
    .addStringOption(opt => opt.setName('model').setDescription('Araç modeli').setRequired(true))
    .addStringOption(opt => opt.setName('kapasite').setDescription('Yük kapasitesi').setRequired(true)),
  async execute(interaction, db, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Bu komutu sadece **Yöneticiler** kullanabilir.', ephemeral: true });
    }
    const plaka = interaction.options.getString('plaka').toUpperCase();
    const model = interaction.options.getString('model');
    const kapasite = interaction.options.getString('kapasite');

    db.prepare('INSERT INTO vehicles (guild_id, plate, model, capacity) VALUES (?, ?, ?, ?)')
      .run(interaction.guild.id, plaka, model, kapasite);

    const embed = new EmbedBuilder()
      .setColor(0x2ECC71)
      .setTitle('🚗 Araç Eklendi')
      .addFields(
        { name: 'Plaka', value: plaka, inline: true },
        { name: 'Model', value: model, inline: true },
        { name: 'Kapasite', value: kapasite, inline: true }
      )
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
