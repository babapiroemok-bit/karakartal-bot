const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('teslimat-al')
    .setDescription('Açık bir teslimatı üstlenir')
    .addIntegerOption(opt => opt.setName('id').setDescription('Teslimat ID\'si').setRequired(true)),
  async execute(interaction, db, client) {
    const driver = db.prepare('SELECT * FROM drivers WHERE user_id = ?').get(interaction.user.id);
    if (!driver) return interaction.reply({ content: '❌ Önce `/sofor-kayit` ile şoför kaydı oluşturmalısın.', ephemeral: true });

    const id = interaction.options.getInteger('id');
    const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ? AND guild_id = ?').get(id, interaction.guild.id);
    if (!delivery) return interaction.reply({ content: `❌ ID **${id}** ile teslimat bulunamadı.`, ephemeral: true });
    if (delivery.status !== 'open') return interaction.reply({ content: '❌ Bu teslimat zaten alınmış veya tamamlanmış.', ephemeral: true });

    db.prepare('UPDATE deliveries SET status = ?, driver_id = ? WHERE id = ?').run('active', interaction.user.id, id);

    const embed = new EmbedBuilder()
      .setColor(0xF39C12)
      .setTitle('🚛 Teslimat Alındı!')
      .addFields(
        { name: '🆔 Teslimat ID', value: `${id}`, inline: true },
        { name: '📍 Başlangıç', value: delivery.start_loc, inline: true },
        { name: '🏁 Bitiş', value: delivery.end_loc, inline: true },
        { name: '📦 Yük', value: delivery.cargo, inline: true },
        { name: '💰 Ücret', value: `${delivery.reward} ₺`, inline: true }
      )
      .setDescription(`${interaction.user} teslimatı üstlendi. Tamamlamak için \`/teslimat-tamamla ${id}\` kullan.`)
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
