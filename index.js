require('dotenv').config({ override: false });
const { Client, GatewayIntentBits, Partials, Collection, Events, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const db = require('./database');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember]
});

client.commands = new Collection();

function loadCommands(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      loadCommands(fullPath);
    } else if (file.name.endsWith('.js')) {
      const command = require(fullPath);
      if (command?.data?.name) {
        client.commands.set(command.data.name, command);
        console.log(`✅ Komut yüklendi: ${command.data.name}`);
      }
    }
  }
}
loadCommands(path.join(__dirname, 'commands'));

client.once(Events.ClientReady, async () => {
  console.log(`✅ KaraKartal Bot aktif! ${client.user.tag}`);
  console.log(`📋 ${client.commands.size} komut yüklendi.`);

  const VC_ID = '1517073292802916493';
  const vc = client.channels.cache.get(VC_ID);
  if (vc) {
    try {
      joinVoiceChannel({
        channelId: vc.id,
        guildId: vc.guild.id,
        adapterCreator: vc.guild.voiceAdapterCreator,
        selfDeaf: true,
        selfMute: true,
      });
      console.log(`🔊 Ses kanalına bağlanıldı: ${vc.name}`);
    } catch (e) {
      console.warn(`⚠️ Ses kanalına bağlanılamadı: ${e.message}`);
    }
  } else {
    console.warn(`⚠️ Ses kanalı bulunamadı: ${VC_ID}`);
  }

  const statuses = [
    '🦅 KaraKartal Logistics aktif',
    '📦 Teslimatlar devam ediyor',
    '🚛 Şoförler yolda',
    '/yardim | karakartal',
  ];
  let i = 0;
  setInterval(() => {
    client.user.setActivity(statuses[i % statuses.length]);
    i++;
  }, 30000);
  client.user.setActivity(statuses[0]);
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction, db, client);
    } catch (err) {
      console.error(`Komut hatası (${interaction.commandName}):`, err);
      const msg = { content: '❌ Bir hata oluştu.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg);
      } else {
        await interaction.reply(msg);
      }
    }
  }

  if (interaction.isButton()) {
    if (interaction.customId.startsWith('ticket_')) {
      const ticketHandler = require('./commands/support/destek');
      await ticketHandler.handleButton(interaction, db, client);
    }
    if (interaction.customId === 'help_next' || interaction.customId === 'help_prev') {
      const yardimHandler = require('./commands/general/yardim');
      await yardimHandler.handleButton(interaction);
    }
  }
});

client.on(Events.MessageCreate, async message => {
  if (message.author.bot || !message.guild) return;
  const xpGain = Math.floor(Math.random() * 11) + 5;
  let row = db.prepare('SELECT * FROM users WHERE user_id = ? AND guild_id = ?').get(message.author.id, message.guild.id);
  if (!row) {
    db.prepare('INSERT INTO users (user_id, guild_id) VALUES (?, ?)').run(message.author.id, message.guild.id);
    row = { xp: 0, level: 1 };
  }
  const newXp = row.xp + xpGain;
  const xpNeeded = Math.floor(row.level * 100 * 1.5);
  if (newXp >= xpNeeded) {
    const newLevel = row.level + 1;
    db.prepare('UPDATE users SET xp = ?, level = ? WHERE user_id = ? AND guild_id = ?').run(newXp - xpNeeded, newLevel, message.author.id, message.guild.id);
    const embed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle('🎉 Seviye Atlandı!')
      .setDescription(`Tebrikler ${message.author}! Yeni seviyeniz: **${newLevel}**`)
      .setFooter({ text: '🦅 KaraKartal Logistics' })
      .setTimestamp();
    message.channel.send({ embeds: [embed] });
  } else {
    db.prepare('UPDATE users SET xp = ? WHERE user_id = ? AND guild_id = ?').run(newXp, message.author.id, message.guild.id);
  }
});

client.on(Events.GuildMemberAdd, async member => {
  const channel = member.guild.channels.cache.find(c => c.name === 'hoş-geldin' || c.name === 'genel' || c.name === 'general');
  if (channel) {
    const embed = new EmbedBuilder()
      .setColor(0xE67E22)
      .setTitle('🦅 KaraKartal Logistics\'e Hoş Geldin!')
      .setDescription(`Merhaba ${member}!\nSunucumuza hoş geldin. Kuralları okumayı unutma.`)
      .addFields({ name: '👥 Toplam Üye', value: `${member.guild.memberCount}`, inline: true })
      .setThumbnail(member.user.displayAvatarURL())
      .setFooter({ text: 'KaraKartal Logistics | Lojistik & Roleplay' })
      .setTimestamp();
    channel.send({ embeds: [embed] });
  }
  const role = member.guild.roles.cache.find(r => r.name === 'Üye');
  if (role) member.roles.add(role).catch(console.error);
});

client.login(process.env.DISCORD_TOKEN);
