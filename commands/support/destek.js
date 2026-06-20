const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

const YETKILİ_ROLLER = ['1515090088265125889', '1515628992269652109'];

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
    // Ticket aç
    if (['ticket_destek', 'ticket_basvuru', 'ticket_sikayet'].includes(interaction.customId)) {
      await openTicket(interaction, db, client);
      return;
    }

    // Üstlen butonu
    if (interaction.customId.startsWith('ticket_ustlen_')) {
      await handleUstlen(interaction, db, client);
      return;
    }

    // Kanalı kapat butonu
    if (interaction.customId.startsWith('ticket_kapat_')) {
      await handleKapat(interaction, db, client);
      return;
    }
  },
};

async function openTicket(interaction, db, client) {
  const typeMap = { ticket_destek: 'destek', ticket_basvuru: 'basvuru', ticket_sikayet: 'sikayet' };
  const labelMap = { destek: '🎫 Destek Talebi', basvuru: '📋 Başvuru Formu', sikayet: '⚠️ Şikayet' };
  const type = typeMap[interaction.customId];

  const guild = interaction.guild;
  const user = interaction.user;
  const channelName = `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16)}-${user.id.slice(-4)}`;

  const existing = guild.channels.cache.find(c => c.name === channelName);
  if (existing) {
    return interaction.reply({ content: `❌ Zaten açık bir ticket'ınız var: ${existing}`, ephemeral: true });
  }

  const permissionOverwrites = [
    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
  ];
  for (const roleId of YETKILİ_ROLLER) {
    const role = guild.roles.cache.get(roleId);
    if (role) permissionOverwrites.push({ id: role.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
  }

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    permissionOverwrites,
  });

  db.prepare('INSERT INTO tickets (guild_id, user_id, type, channel_id, created_at) VALUES (?, ?, ?, ?, ?)').run(guild.id, user.id, type, channel.id, new Date().toISOString());

  const ticketEmbed = new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle(labelMap[type])
    .setDescription(`Merhaba ${user}! Ticket'ınız oluşturuldu.\n\nYetkililerimiz en kısa sürede size yardımcı olacak.\nLütfen sorununuzu detaylı şekilde açıklayın.`)
    .setFooter({ text: '🦅 KaraKartal Logistics' })
    .setTimestamp();

  // Sadece Üstlen butonu — kapat butonu üstlendikten sonra gelecek
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ticket_ustlen_${channel.id}`)
      .setLabel('✋ Üstlen')
      .setStyle(ButtonStyle.Success),
  );

  const yetkililerMention = YETKILİ_ROLLER.map(id => `<@&${id}>`).join(' ');
  await channel.send({ content: `${user} ${yetkililerMention}`, embeds: [ticketEmbed], components: [row] });
  await interaction.reply({ content: `✅ Ticket oluşturuldu: ${channel}`, ephemeral: true });
}

async function handleUstlen(interaction, db, client) {
  const yetkili = interaction.member.roles.cache.some(r => YETKILİ_ROLLER.includes(r.id));
  if (!yetkili) return interaction.reply({ content: '❌ Sadece yetkililer ticket üstlenebilir!', ephemeral: true });

  const channelId = interaction.customId.replace('ticket_ustlen_', '');

  // Üstlen butonunu devre dışı bırak
  const ustlenRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ticket_ustlen_${channelId}`)
      .setLabel(`✅ ${interaction.user.username} üstlendi`)
      .setStyle(ButtonStyle.Success)
      .setDisabled(true),
  );
  await interaction.update({ components: [ustlenRow] });

  // Üstlenme mesajı + Kapat butonu
  const kapatRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ticket_kapat_${channelId}`)
      .setLabel('🔒 Kanalı Kapat')
      .setStyle(ButtonStyle.Danger),
  );

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setDescription(`✋ **${interaction.user}** bu ticket'ı üstlendi. Yardımcı olmaya hazır!`)
    .setFooter({ text: '🦅 KaraKartal Logistics' })
    .setTimestamp();

  await interaction.channel.send({ embeds: [embed], components: [kapatRow] });
}

async function handleKapat(interaction, db, client) {
  const yetkili = interaction.member.roles.cache.some(r => YETKILİ_ROLLER.includes(r.id));
  if (!yetkili) return interaction.reply({ content: '❌ Sadece yetkililer kanalı kapatabilir!', ephemeral: true });

  // Kapat butonunu devre dışı bırak
  const disabled = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_kapat_disabled')
      .setLabel('🔒 Kapatılıyor...')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(true),
  );
  await interaction.update({ components: [disabled] });

  const embed = new EmbedBuilder()
    .setColor(0xe74c3c)
    .setDescription('🔒 Bu ticket kapatıldı. Kanal **5 saniye** içinde silinecek.')
    .setFooter({ text: '🦅 KaraKartal Logistics' })
    .setTimestamp();

  await interaction.channel.send({ embeds: [embed] });

  // DB güncelle
  db.prepare("UPDATE tickets SET status = 'closed' WHERE channel_id = ?").run(interaction.channel.id);

  // 5 saniye sonra sil
  setTimeout(async () => {
    await interaction.channel.delete().catch(() => {});
  }, 5000);
}
