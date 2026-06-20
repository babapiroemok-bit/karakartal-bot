const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const YETKILİ_ROLLER = ['1515090088265125889', '1515628992269652109'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('para-al')
    .setDescription('Kullanıcıdan bakiye düşer. (Yetkili)')
    .addUserOption(o => o.setName('kullanici').setDescription('Para alınacak kullanıcı').setRequired(true))
    .addIntegerOption(o => o.setName('miktar').setDescription('Düşülecek miktar (₺)').setMinValue(1).setRequired(true))
    .addStringOption(o => o.setName('sebep').setDescription('Sebep').setRequired(false)),

  async execute(interaction, db, client) {
    const yetkili = interaction.member.roles.cache.some(r => YETKILİ_ROLLER.includes(r.id));
    if (!yetkili) return interaction.reply({ content: '❌ Bu komutu kullanma yetkiniz yok!', ephemeral: true });

    const hedef = interaction.options.getUser('kullanici');
    const miktar = interaction.options.getInteger('miktar');
    const sebep = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

    db.prepare('INSERT OR IGNORE INTO users (user_id, guild_id) VALUES (?, ?)').run(hedef.id, interaction.guild.id);

    const mevcutUser = db.prepare('SELECT balance FROM users WHERE user_id = ? AND guild_id = ?').get(hedef.id, interaction.guild.id);
    const mevcutBalans = mevcutUser ? mevcutUser.balance : 0;

    if (mevcutBalans < miktar) {
      return interaction.reply({
        content: `❌ Kullanıcının bakiyesi yetersiz! Mevcut: ₺${mevcutBalans}`,
        ephemeral: true,
      });
    }

    db.prepare('UPDATE users SET balance = balance - ? WHERE user_id = ? AND guild_id = ?').run(miktar, hedef.id, interaction.guild.id);
    const yeniBalans = db.prepare('SELECT balance FROM users WHERE user_id = ? AND guild_id = ?').get(hedef.id, interaction.guild.id);

    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle('💸 Para Alındı')
      .addFields(
        { name: '👤 Kullanıcı', value: `${hedef}`, inline: true },
        { name: '➖ Düşülen', value: `₺${miktar}`, inline: true },
        { name: '💰 Yeni Bakiye', value: `₺${yeniBalans.balance}`, inline: true },
        { name: '📝 Sebep', value: sebep },
      )
      .setFooter({ text: `🦅 KaraKartal Logistics • ${interaction.user.username} tarafından` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
