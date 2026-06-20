const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

const İZİNLİ_KULLANICI = '1457350623770054758';
const İZİNLİ_ROL = '1515044780776886484';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ip-ban')
    .setDescription('Kullanıcıyı sunucudan kalıcı olarak banlar. (Sadece Owner)')
    .addUserOption(o => o.setName('kullanici').setDescription('Banlanacak kullanıcı').setRequired(true))
    .addStringOption(o => o.setName('sebep').setDescription('Ban sebebi').setRequired(false)),

  async execute(interaction, db, client) {
    const yetkili =
      interaction.user.id === İZİNLİ_KULLANICI ||
      interaction.member.roles.cache.has(İZİNLİ_ROL);

    if (!yetkili) return interaction.reply({ content: '❌ Bu komutu kullanma yetkiniz yok! Sadece Owner kullanabilir.', ephemeral: true });

    const hedef = interaction.options.getUser('kullanici');
    const sebep = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

    if (hedef.id === interaction.user.id) {
      return interaction.reply({ content: '❌ Kendinizi banlayamazsınız!', ephemeral: true });
    }
    if (hedef.id === client.user.id) {
      return interaction.reply({ content: '❌ Botu banlayamazsınız!', ephemeral: true });
    }

    const onayEmbed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle('⚠️ Kalıcı Ban Onayı')
      .setDescription(`**${hedef.username}** (${hedef.id}) kullanıcısını kalıcı olarak banlamak istediğinizden emin misiniz?\n\n> **Sebep:** ${sebep}`)
      .setThumbnail(hedef.displayAvatarURL())
      .setFooter({ text: '30 saniye içinde yanıtlanmazsa otomatik iptal olur.' });

    const satirlar = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`ipban_onayla_${hedef.id}`).setLabel('✅ Onayla — Banla').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('ipban_iptal').setLabel('❌ İptal').setStyle(ButtonStyle.Secondary),
    );

    const msg = await interaction.reply({ embeds: [onayEmbed], components: [satirlar], fetchReply: true });

    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async (btn) => {
      if (btn.user.id !== interaction.user.id) {
        return btn.reply({ content: '❌ Bu onay size ait değil!', ephemeral: true });
      }

      if (btn.customId === 'ipban_iptal') {
        collector.stop('iptal');
        const iptalEmbed = new EmbedBuilder().setColor(0x95a5a6).setDescription('🚫 Ban işlemi iptal edildi.');
        return btn.update({ embeds: [iptalEmbed], components: [] });
      }

      if (btn.customId.startsWith('ipban_onayla_')) {
        try {
          const member = await interaction.guild.members.fetch(hedef.id).catch(() => null);
          if (member) {
            await member.ban({ reason: `[ip-ban] ${interaction.user.username}: ${sebep}`, deleteMessageSeconds: 0 });
          } else {
            await interaction.guild.bans.create(hedef.id, { reason: `[ip-ban] ${interaction.user.username}: ${sebep}` });
          }

          collector.stop('tamamlandi');

          const basariEmbed = new EmbedBuilder()
            .setColor(0xe74c3c)
            .setTitle('🔨 Kullanıcı Kalıcı Olarak Banlandı')
            .setThumbnail(hedef.displayAvatarURL())
            .addFields(
              { name: '👤 Kullanıcı', value: `${hedef.username} (${hedef.id})`, inline: true },
              { name: '👮 Yetkili', value: interaction.user.username, inline: true },
              { name: '📝 Sebep', value: sebep },
            )
            .setFooter({ text: '🦅 KaraKartal Logistics' })
            .setTimestamp();

          return btn.update({ embeds: [basariEmbed], components: [] });
        } catch (err) {
          return btn.update({
            embeds: [new EmbedBuilder().setColor(0xe74c3c).setDescription(`❌ Ban uygulanamadı: ${err.message}`)],
            components: [],
          });
        }
      }
    });

    collector.on('end', (_, reason) => {
      if (reason === 'time') {
        interaction.editReply({
          embeds: [new EmbedBuilder().setColor(0x95a5a6).setDescription('⏱️ Süre doldu, ban işlemi iptal edildi.')],
          components: [],
        }).catch(() => {});
      }
    });
  },
};
