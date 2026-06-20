const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('teslimat-al')
    .setDescription('Açık teslimatı üstlenir.')
    .addIntegerOption(o => o.setName('id').setDescription('Teslimat ID').setRequired(true)),

  async execute(interaction, db, client) {
    const id = interaction.options.getInteger('id');
    const driver = db.prepare('SELECT * FROM drivers WHERE user_id = ?').get(interaction.user.id);
    if (!driver) return interaction.reply({ content: '❌ Önce `/sofor-kayit` ile şoför olarak kayıt olun!', ephemeral: true });

    const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ? AND guild_id = ?').get(id, interaction.guild.id);
    if (!delivery) return interaction.reply({ content: '❌ Teslimat bulunamadı!', ephemeral: true });
    if (delivery.status !== 'open') return interaction.reply({ content: '❌ Bu teslimat zaten alınmış!', ephemeral: true });

    db.prepare('UPDATE deliveries SET driver_id = ?, status = ? WHERE id = ?').run(interaction.user.id, 'active', id);

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('🚛 Teslimat Alındı')
      .addFields(
        { name: '🆔 Teslimat ID', value: `#${id}`, inline: true },
        { name: '📍 Güzergah', value: `${delivery.start_loc} → ${delivery.end_loc}`, inline: false },
        { name: '📦 Yük', value: delivery.cargo, inline: true },
        { name: '💰 Ücret', value: `₺${delivery.reward}`, inline: true },
      )
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
