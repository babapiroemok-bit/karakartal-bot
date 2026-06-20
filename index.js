require('dotenv').config();

// Global hata yakalayıcılar — bunlar olmadan herhangi bir async hata botu çökertiyor
process.on('unhandledRejection', (err) => {
  console.error('[UnhandledRejection]', err?.message || err);
});
process.on('uncaughtException', (err) => {
  console.error('[UncaughtException]', err?.message || err);
});

const { Client, GatewayIntentBits, Partials, Collection, Events, ActivityType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const db = require('./database.js');

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
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
});

client.commands = new Collection();

function loadCommands(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      loadCommands(fullPath);
    } else if (file.name.endsWith('.js')) {
      try {
        const command = require(fullPath);
        if (command.data && command.execute) {
          client.commands.set(command.data.name, command);
        }
      } catch (err) {
        console.error(`Komut yüklenemedi: ${file.name} —`, err.message);
      }
    }
  }
}

loadCommands(path.join(__dirname, 'commands'));
console.log(`${client.commands.size} komut yüklendi.`);

client.once(Events.ClientReady, (c) => {
  console.log(`KaraKartal Bot aktif | ${c.user.tag}`);

  // Ses kanalı bağlantısı — tamamen opsiyonel, hata botı çökertemez
  try {
    const { joinVoiceChannel } = require('@discordjs/voice');
    const guild = c.guilds.cache.first();
    if (guild) {
      const voiceChannel = guild.channels.cache.get('1517073292802916493');
      if (voiceChannel) {
        joinVoiceChannel({
          channelId: '1517073292802916493',
          guildId: guild.id,
          adapterCreator: guild.voiceAdapterCreator,
          selfDeaf: true,
          selfMute: true,
        });
        console.log('Ses kanalına bağlandı.');
      } else {
        console.log('Ses kanalı bulunamadı, atlanıyor.');
      }
    }
  } catch (err) {
    console.log('Ses modülü yüklenemedi, atlanıyor:', err.message);
  }

  // Rotating presence
  const presences = [
    { name: '🦅 KaraKartal Logistics aktif', type: ActivityType.Playing },
    { name: '📦 Teslimatlar devam ediyor', type: ActivityType.Watching },
    { name: '🚛 Şoförler yolda', type: ActivityType.Watching },
    { name: '/yardim | karakartal', type: ActivityType.Listening },
  ];
  let i = 0;
  try { c.user.setActivity(presences[0]); } catch (_) {}
  setInterval(() => {
    i++;
    try { c.user.setActivity(presences[i % presences.length]); } catch (_) {}
  }, 30000);
});

client.on(Events.GuildMemberAdd, async (member) => {
  try {
    const channel =
      member.guild.channels.cache.find((c) => c.name === 'hos-geldin') ||
      member.guild.channels.cache.find((c) => c.name === 'genel') ||
      member.guild.channels.cache.find((c) => c.name === 'general');

    if (channel) {
      const embed = new EmbedBuilder()
        .setColor(0xe67e22)
        .setTitle('🦅 KaraKartal Logistics Hoş Geldin')
        .setDescription(`${member} sunucumuza hoş geldin!\nToplam üye sayısı: **${member.guild.memberCount}**`)
        .setFooter({ text: 'KaraKartal Logistics' })
        .setTimestamp();
      await channel.send({ embeds: [embed] });
    }

    const role = member.guild.roles.cache.find((r) => r.name === 'Üye');
    if (role) await member.roles.add(role);
  } catch (err) {
    console.error('GuildMemberAdd hatası:', err.message);
  }
});

client.on(Events.MessageCreate, async (message) => {
  try {
    if (message.author.bot || !message.guild) return;

    const xpGain = Math.floor(Math.random() * 11) + 5;
    const userId = message.author.id;
    const guildId = message.guild.id;

    let user = db.prepare('SELECT * FROM users WHERE user_id = ? AND guild_id = ?').get(userId, guildId);
    if (!user) {
      db.prepare('INSERT OR IGNORE INTO users (user_id, guild_id) VALUES (?, ?)').run(userId, guildId);
      user = db.prepare('SELECT * FROM users WHERE user_id = ? AND guild_id = ?').get(userId, guildId);
    }
    if (!user) return;

    const newXp = user.xp + xpGain;
    const xpNeeded = Math.floor(user.level * 100 * 1.5);

    if (newXp >= xpNeeded) {
      const newLevel = user.level + 1;
      db.prepare('UPDATE users SET xp = 0, level = ? WHERE user_id = ? AND guild_id = ?').run(newLevel, userId, guildId);
      const embed = new EmbedBuilder()
        .setColor(0xf1c40f)
        .setTitle('🎉 Seviye Atladın!')
        .setDescription(`${message.author} **${newLevel}. seviyeye** ulaştı! Tebrikler!`)
        .setFooter({ text: '🦅 KaraKartal Logistics' })
        .setTimestamp();
      await message.channel.send({ embeds: [embed] });
    } else {
      db.prepare('UPDATE users SET xp = ? WHERE user_id = ? AND guild_id = ?').run(newXp, userId, guildId);
    }
  } catch (err) {
    console.error('MessageCreate hatası:', err.message);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction, db, client);
      } catch (err) {
        console.error(`Komut hatası [${interaction.commandName}]:`, err.message);
        const msg = { content: '❌ Bir hata oluştu!', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(msg).catch(() => {});
        } else {
          await interaction.reply(msg).catch(() => {});
        }
      }
      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId.startsWith('ticket_')) {
        const destek = require('./commands/support/destek.js');
        await destek.handleButton(interaction, db, client);
      }
    }
  } catch (err) {
    console.error('InteractionCreate hatası:', err.message);
  }
});

client.login(process.env.DISCORD_TOKEN);
