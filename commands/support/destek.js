const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('destek')
    .setDescription('Destek ticket panelini açar.'),

  async execute(interaction, db, client) {
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('🎫 KaraKartal Destek Sistemi')
      .setDescription('Aşağıdaki butonlardan birine tıklayarak ticket oluşturabilirsiniz.')
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_destek').setLabel('🎫 Destek Talebi').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('ticket_basvuru').setLabel('📋 Başvuru Formu').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('ticket_sikayet').setLabel('⚠️ Şikayet').setStyle(ButtonStyle.Danger),
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },

  async handleButton(interaction, db, client) {
    const typeMap = {
      ticket_destek: 'destek',
      ticket_basvuru: 'basvuru',
      ticket_sikayet: 'sikayet',
    };

    const type = typeMap[interaction.customId];
    if (!type) return;

    const guild = interaction.guild;
    const user = interaction.user;
    const channelName = `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}-${user.id.slice(-4)}`;

    const existing = guild.channels.cache.find(c => c.name === channelName);
    if (existing) {
      return interaction.reply({ content: `❌ Zaten açık bir ticket'ınız var: ${existing}`, ephemeral: true });
    }

    const yetkiliRole = guild.roles.cache.find(r => r.name === 'Yetkili');
    const modRole = guild.roles.cache.find(r => r.name === 'Moderator');

    const permissionOverwrites = [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    ];
    if (yetkiliRole) permissionOverwrites.push({ id: yetkiliRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
    if (modRole) permissionOverwrites.push({ id: modRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });

    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      permissionOverwrites,
    });

    db.prepare('INSERT INTO tickets (guild_id, user_id, type, channel_id, created_at) VALUES (?, ?, ?, ?, ?)').run(guild.id, user.id, type, channel.id, new Date().toISOString());

    const labelMap = { destek: '🎫 Destek Talebi', basvuru: '📋 Başvuru Formu', sikayet: '⚠️ Şikayet' };

    const ticketEmbed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`${labelMap[type]}`)
      .setDescription(`Merhaba ${user}! Ticket'ınız oluşturuldu. Yetkililerimiz en kısa sürede size yardımcı olacak.`)
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();

    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_kapat').setLabel('🔒 Ticket Kapat').setStyle(ButtonStyle.Danger),
    );

    await channel.send({ content: `${user} ${yetkiliRole || ''} ${modRole || ''}`, embeds: [ticketEmbed], components: [closeRow] });

    await interaction.reply({ content: `✅ Ticket oluşturuldu: ${channel}`, ephemeral: true });

    if (interaction.customId === 'ticket_kapat') {
      await channel.delete().catch(() => {});
    }
  },
};
