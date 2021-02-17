require('module-alias/register')

// const Discord = require('discord.js')
// const client = new Discord.Client()

const MongoClient = require('mongodb').MongoClient;
const MongoDBProvider = require('commando-provider-mongo').MongoDBProvider;
const fs = require('fs')
const path = require('path')
const Commando = require('discord.js-commando')

const config = require('@root/config.json')
const { loadLanguages } = require('@util/language')
const loadCommands = require('@root/commands/load-commands')
const commandBase = require('@root/commands/command-base')
const loadFeatures = require('@root/features/load-features')
const mongo = require('@util/mongo')
const messageCount = require('@features/message-counter')
const inviteNotifications = require('@features/invite-notifications')
const memberCounter = require('@counters/member-counter')

const random = require('random')
const jsonfile = require('jsonfile')

const client = new Commando.CommandoClient({
  owner: '722568849932943505',
  commandPrefix: config.prefix,
})

client.setProvider(
	MongoClient.connect('mongodb://localhost:27017/discordbot').then(client => new MongoDBProvider(client, 'discordbot'))
).catch(console.error);

client.on('ready', async () => {
    console.log('Oranged Utilities is online!')
    client.user.setActivity('Lounge Coversations', { type: 'LISTENING'})

    client.registry
    .registerGroups([
      ['misc', 'misc commands'],
      ['moderation', 'moderation commands'],
      ['economy', 'Commands for the economy system'],
      ['thanks', 'Commands to help thank people'],
      ['suggestions', 'Commands regarding suggestions'],
    ])
    .registerDefaults()
    .registerCommandsIn(path.join(__dirname, 'cmds'))

    loadLanguages(client)
    // commandBase.loadPrefixes(client)
    loadCommands(client)
    loadFeatures(client)
    messageCount(client)
    inviteNotifications(client)
    memberCounter(client)
})

var stats = {};
if (fs.existsSync('stats.json')) {
   stats = jsonfile.readFileSync('stats.json');
}

client.on('message', (message) => {
    if (message.author.id == client.user.id)
    return;

    if (message.guild.id in stats === false) {
        stats[message.guild.id] = {};
    }

    const guildStats = stats[message.guild.id];
    if (message.author.id in guildStats === false) {
        guildStats[message.author.id] = {
            xp: 0,
            level: 0,
            last_message: 0
        };
    }

    const userStats = guildStats[message.author.id];
    if (Date.now() - userStats.last_message > 5000) {
    userStats.xp += random.int(15, 25);
    userStats.last_message = Date.now();

    const xpToNextLevel = 5 * Math.pow(userStats.level, 2) + 50 * userStats.level + 100;
    if (userStats.xp >= xpToNextLevel) {
        userStats.level++;
        userStats.xp = userStats.xp - xpToNextLevel;
        client.channels.cache.get('807861368937512971').send(' GG ' + (`${message.author},`) + ' you just advanced to level ' + userStats.level);
    }

    jsonfile.writeFileSync('stats.json', stats);

    console.log(message.author.username + ' now has ' + userStats.xp);
    console.log(xpToNextLevel + 'XP needed for next level.');
}
    
    const parts = message.content.split('  ');

    if(parts[0] === '!hello') {
        message.reply('hi');
    }
})
  
client.login(config.token);