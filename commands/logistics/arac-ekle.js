const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('arac-ekle')
    .setDescription('Araç fleet\'e ekler. (Admin)')
    .addStringOption(o => o.setName('plaka').setDescription('Plaka').setRequired(true))
    .addStringOption(o => o.setName('model').setDescription('Araç modeli').setRequired(true))
    .addStringOption(o => o.setName('kapasite').setDescription('Yük kapasitesi').setRequired(true)),

  async execute(interaction, db, client) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Bu komutu sadece adminler kullanabilir!', ephemeral: true });
    }

    const plaka = interaction.options.getString('plaka');
    const model = interaction.options.getString('model');
    const kapasite = interaction.options.getString('kapasite');

    db.prepare('INSERT INTO vehicles (guild_id, plate, model, capacity) VALUES (?, ?, ?, ?)').run(interaction.guild.id, plaka, model, kapasite);

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle('✅ Araç Eklendi')
      .addFields(
        { name: '🚗 Plaka', value: plaka, inline: true },
        { name: '🚛 Model', value: model, inline: true },
        { name: '📦 Kapasite', value: kapasite, inline: true },
      )
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
