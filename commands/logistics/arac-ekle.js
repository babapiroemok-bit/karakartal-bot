const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const YETKILİ_ROLLER = ['1515090088265125889', '1515628992269652109'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('arac-ekle')
    .setDescription('Araç fleet\'e ekler.')
    .addStringOption(o => o.setName('plaka').setDescription('Plaka').setRequired(true))
    .addStringOption(o => o.setName('model').setDescription('Araç modeli').setRequired(true))
    .addStringOption(o => o.setName('kapasite').setDescription('Yük kapasitesi').setRequired(true)),

  async execute(interaction, db, client) {
    const yetkili = interaction.member.roles.cache.some(r => YETKILİ_ROLLER.includes(r.id));
    if (!yetkili) return interaction.reply({ content: '❌ Bu komutu kullanma yetkiniz yok!', ephemeral: true });

    const plaka = interaction.options.getString('plaka');
    const model = interaction.options.getString('model');
    const kapasite = interaction.options.getString('kapasite');

    db.prepare('INSERT INTO vehicles (guild_id, plate, model, capacity) VALUES (?, ?, ?, ?)').run(interaction.guild.id, plaka, model, kapasite);

    await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x2ecc71).setTitle('✅ Araç Eklendi').addFields({ name: '🚗 Plaka', value: plaka, inline: true }, { name: '🚛 Model', value: model, inline: true }, { name: '📦 Kapasite', value: kapasite, inline: true }).setFooter({ text: '🦅 KaraKartal Logistics' }).setTimestamp()] });
  },
};
