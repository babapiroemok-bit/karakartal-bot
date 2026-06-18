require('dotenv').config({ override: false });
const { Client, GatewayIntentBits, Partials, Collection, Events, EmbedBuilder, REST, Routes } = require('discord.js');
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
        console.log(`Komut yuklendi: ${command.data.name}`);
      }
    }
  }
}
loadCommands(path.join(__dirname, 'commands'));

async function registerCommands(clientId, guildId) {
  const commands = [];
  client.commands.forEach(cmd => commands.push(cmd.data.toJSON()));
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);
  try {
    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.log(`${commands.length} slash komutu sunucuya aninda register edildi.`);
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log(`${commands.length} slash komutu global olarak register edildi.`);
    }
  } catch (err) {
    console.error('Komut register hatasi:', err.message);
  }
}

client.once(Events.ClientReady, async () => {
  console.log(`Bot aktif: ${client.user.tag}`);
  console.log(`${client.commands.size} komut yuklendi.`);

  await registerCommands(client.application.id, process.env.GUILD_ID);

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
      console.log(`Ses kanalina baglandi: ${vc.name}`);
    } catch (e) {
      console.warn(`Ses kanalina baglanamadi: ${e.message}`);
    }
  } else {
    console.warn(`Ses kanali bulunamadi: ${VC_ID}`);
  }

  const statuses = [
    'KaraKartal Logistics aktif',
    'Teslimatlar devam ediyor',
    'Soforler yolda',
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
      console.error(`Komut hatasi (${interaction.commandName}):`, err);
      const msg = { content: 'Bir hata olustu.', ephemeral: true };
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
      .setTitle('Seviye Atlandi!')
      .setDescription(`Tebrikler ${message.author}! Yeni seviyeniz: **${newLevel}**`)
      .setFooter({ text: 'KaraKartal Logistics' })
      .setTimestamp();
    message.channel.send({ embeds: [embed] });
  } else {
    db.prepare('UPDATE users SET xp = ? WHERE user_id = ? AND guild_id = ?').run(newXp, message.author.id, message.guild.id);
  }
});

client.on(Events.GuildMemberAdd, async member => {
  const channel = member.guild.channels.cache.find(c => c.name === 'hos-geldin' || c.name === 'genel' || c.name === 'general');
  if (channel) {
    const embed = new EmbedBuilder()
      .setColor(0xE67E22)
      .setTitle('KaraKartal Logisticse Hos Geldin!')
      .setDescription(`Merhaba ${member}!\nSunucumuza hos geldin. Kurallari okumay unutma.`)
      .addFields({ name: 'Toplam Uye', value: `${member.guild.memberCount}`, inline: true })
      .setThumbnail(member.user.displayAvatarURL())
      .setFooter({ text: 'KaraKartal Logistics | Lojistik & Roleplay' })
      .setTimestamp();
    channel.send({ embeds: [embed] });
  }
  const role = member.guild.roles.cache.find(r => r.name === 'Uye');
  if (role) member.roles.add(role).catch(console.error);
});

client.login(process.env.DISCORD_TOKEN);
