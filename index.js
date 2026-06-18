require('dotenv').config({ override: false });
const { Client, GatewayIntentBits, Partials, Collection, Events, EmbedBuilder, REST, Routes } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const db = require('./database');

// Eksik env var kontrolu
const required = ['DISCORD_TOKEN'];
const missing = required.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error('HATA: Eksik environment variables:', missing.join(', '));
  process.exit(1);
}

console.log('Bot baslatiliyor...');
console.log('NODE_VERSION:', process.version);
console.log('GUILD_ID:', process.env.GUILD_ID ? 'SET' : 'NOT SET (global register kullanilacak)');

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
      try {
        const command = require(fullPath);
        if (command?.data?.name) {
          client.commands.set(command.data.name, command);
          console.log('Komut yuklendi:', command.data.name);
        }
      } catch (e) {
        console.error('Komut yuklenemedi:', fullPath, e.message);
      }
    }
  }
}

try {
  loadCommands(path.join(__dirname, 'commands'));
  console.log('Toplam komut sayisi:', client.commands.size);
} catch (e) {
  console.error('loadCommands hatasi:', e.message);
}

async function registerCommands(clientId, guildId) {
  const commands = [];
  client.commands.forEach(cmd => {
    try { commands.push(cmd.data.toJSON()); } catch(e) { console.error('toJSON hatasi:', e.message); }
  });
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);
  try {
    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.log(commands.length + ' komut guild\'e register edildi. Guild ID:', guildId);
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log(commands.length + ' komut global olarak register edildi (1 saat surabilir).');
    }
  } catch (err) {
    console.error('Komut register hatasi (bot calismaya devam ediyor):', err.message);
  }
}

client.once(Events.ClientReady, async () => {
  console.log('Bot Discord\'a baglandi:', client.user.tag);
  console.log('Client ID:', client.application.id);

  await registerCommands(client.application.id, process.env.GUILD_ID || null);

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
      console.log('Ses kanalina baglandi:', vc.name);
    } catch (e) {
      console.warn('Ses kanalina baglanamadi (bot calismaya devam ediyor):', e.message);
    }
  }

  const statuses = [
    'KaraKartal Logistics aktif',
    'Teslimatlar devam ediyor',
    'Soforler yolda',
    '/yardim | karakartal',
  ];
  let i = 0;
  setInterval(() => { client.user.setActivity(statuses[i % statuses.length]); i++; }, 30000);
  client.user.setActivity(statuses[0]);
  console.log('Bot hazir! Komutlar aktif.');
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction, db, client);
    } catch (err) {
      console.error('Komut hatasi (' + interaction.commandName + '):', err);
      const msg = { content: 'Bir hata olustu.', ephemeral: true };
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(msg);
        } else {
          await interaction.reply(msg);
        }
      } catch(e) {}
    }
  }

  if (interaction.isButton()) {
    try {
      if (interaction.customId.startsWith('ticket_')) {
        const ticketHandler = require('./commands/support/destek');
        await ticketHandler.handleButton(interaction, db, client);
      }
      if (interaction.customId === 'help_next' || interaction.customId === 'help_prev') {
        const yardimHandler = require('./commands/general/yardim');
        await yardimHandler.handleButton(interaction);
      }
    } catch(e) {
      console.error('Button handler hatasi:', e.message);
    }
  }
});

client.on(Events.MessageCreate, async message => {
  if (message.author.bot || !message.guild) return;
  try {
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
        .setTitle('Seviye Atlandi!')
        .setDescription('Tebrikler ' + message.author + '! Yeni seviyeniz: **' + newLevel + '**')
        .setFooter({ text: 'KaraKartal Logistics' })
        .setTimestamp();
      message.channel.send({ embeds: [embed] });
    } else {
      db.prepare('UPDATE users SET xp = ? WHERE user_id = ? AND guild_id = ?').run(newXp, message.author.id, message.guild.id);
    }
  } catch(e) {
    console.error('XP hatasi:', e.message);
  }
});

client.on(Events.GuildMemberAdd, async member => {
  try {
    const channel = member.guild.channels.cache.find(c => c.name === 'hos-geldin' || c.name === 'genel' || c.name === 'general');
    if (channel) {
      const embed = new EmbedBuilder()
        .setColor(0xE67E22)
        .setTitle('KaraKartal Logisticse Hos Geldin!')
        .setDescription('Merhaba ' + member + '!\nSunucumuza hos geldin.')
        .addFields({ name: 'Toplam Uye', value: '' + member.guild.memberCount, inline: true })
        .setThumbnail(member.user.displayAvatarURL())
        .setFooter({ text: 'KaraKartal Logistics' })
        .setTimestamp();
      channel.send({ embeds: [embed] });
    }
    const role = member.guild.roles.cache.find(r => r.name === 'Uye');
    if (role) member.roles.add(role).catch(console.error);
  } catch(e) {
    console.error('GuildMemberAdd hatasi:', e.message);
  }
});

// Beklenmedik hatalarda botu kapat
process.on('unhandledRejection', err => {
  console.error('Unhandled rejection:', err);
});
process.on('uncaughtException', err => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

console.log('Discord login deneniyor...');
client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error('LOGIN HATASI:', err.message);
  process.exit(1);
});
