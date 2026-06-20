const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const YETKILİ_ROLLER = ['1515090088265125889', '1515628992269652109'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-zorla-kapat')
    .setDescription('Belirtilen ticket kanalını zorla kapatır ve 5 saniyede siler.')
    .addChannelOption(o =>
      o.setName('kanal').setDescription('Kapatılacak ticket kanalı (boş = mevcut kanal)').setRequired(false)
    ),

  async execute(interaction, db, client) {
    const yetkili = interaction.member.roles.cache.some(r => YETKILİ_ROLLER.includes(r.id));
    if (!yetkili) return interaction.reply({ content: '❌ Bu komutu kullanma yetkiniz yok!', ephemeral: true });

    const hedefKanal = interaction.options.getChannel('kanal') || interaction.channel;

    const ticket = db.prepare("SELECT * FROM tickets WHERE channel_id = ? AND status = 'open'").get(hedefKanal.id);
    if (!ticket) {
      return interaction.reply({ content: '❌ Bu kanal aktif bir ticket kanalı değil!', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle('🔒 Ticket Zorla Kapatıldı')
      .setDescription(`Bu ticket **${interaction.user}** tarafından zorla kapatıldı.\nKanal **5 saniye** içinde silinecek.`)
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    db.prepare("UPDATE tickets SET status = 'closed' WHERE channel_id = ?").run(hedefKanal.id);

    setTimeout(async () => {
      await hedefKanal.delete().catch(() => {});
    }, 5000);
  },
};
