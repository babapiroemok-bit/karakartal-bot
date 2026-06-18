const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('destek')
    .setDescription('Destek sistemi — ticket oluştur'),
  async execute(interaction, db, client) {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🎫 KaraKartal Destek Sistemi')
      .setDescription('Aşağıdaki butonlardan birini seçerek ticket oluşturabilirsin.\n\n🎫 **Destek** — Teknik yardım\n📋 **Başvuru** — Şoför veya yetkili başvurusu\n⚠️ **Şikayet** — Şikayet bildirimi')
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_destek').setLabel('🎫 Destek').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('ticket_basvuru').setLabel('📋 Başvuru').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('ticket_sikayet').setLabel('⚠️ Şikayet').setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },

  async handleButton(interaction, db, client) {
    if (interaction.customId === 'ticket_kapat') {
      const embed = new EmbedBuilder()
        .setColor(0xE74C3C)
        .setTitle('🔒 Ticket Kapatıldı')
        .setDescription(`Ticket **${interaction.channel.name}** kapatıldı.`)
        .setFooter({ text: '🦅 KaraKartal Logistics' })
        .setTimestamp();

      const logChannel = interaction.guild.channels.cache.find(c => c.name === 'ticket-log');
      if (logChannel) logChannel.send({ embeds: [embed] });

      await interaction.reply({ content: '🔒 Ticket 5 saniye içinde silinecek...', ephemeral: false });

      db.prepare('UPDATE tickets SET status = ? WHERE channel_id = ?').run('closed', interaction.channel.id);

      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
      }, 5000);
      return;
    }

    const typeMap = {
      ticket_destek: { label: 'Destek', emoji: '🎫' },
      ticket_basvuru: { label: 'Başvuru', emoji: '📋' },
      ticket_sikayet: { label: 'Şikayet', emoji: '⚠️' }
    };
    const type = typeMap[interaction.customId];
    if (!type) return;

    const existing = db.prepare('SELECT * FROM tickets WHERE user_id = ? AND guild_id = ? AND status = ?').get(interaction.user.id, interaction.guild.id, 'open');
    if (existing) {
      return interaction.reply({ content: `❌ Zaten açık bir ticket'ın var: <#${existing.channel_id}>`, ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const channelName = `ticket-${interaction.user.username}-${interaction.customId.replace('ticket_', '')}`;

    const staffRole = interaction.guild.roles.cache.find(r => r.name === 'Yetkili' || r.name === 'Moderatör');
    const permissionOverwrites = [
      { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
    ];
    if (staffRole) permissionOverwrites.push({ id: staffRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });

    const channel = await interaction.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      permissionOverwrites
    });

    db.prepare('INSERT INTO tickets (guild_id, user_id, type, channel_id, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(interaction.guild.id, interaction.user.id, type.label, channel.id, new Date().toISOString());

    const ticketEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`${type.emoji} ${type.label} Ticket`)
      .setDescription(`Merhaba ${interaction.user}!\nTicket'ın oluşturuldu. Yetkili ekibimiz en kısa sürede sana yardımcı olacak.\n\nLütfen sorununu veya talebini detaylıca açıkla.`)
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_kapat').setLabel('🔒 Kapat').setStyle(ButtonStyle.Danger)
    );

    await channel.send({ content: `${interaction.user} ${staffRole ? staffRole : ''}`, embeds: [ticketEmbed], components: [closeRow] });
    await interaction.editReply({ content: `✅ Ticket oluşturuldu: ${channel}` });
  }
};
