const fs = require('fs');
const dotenv = require('dotenv');
const Discord = require('discord.js');
dotenv.config();

const client = new Discord.Client();

client.config = require('./config/bot');
client.emotes = client.config.emojis;
client.commands = new Discord.Collection();
client.queues = new Map();
client.cooldowns = new Map();

console.log(`Loading commands...`);

fs.readdirSync('./commands').forEach(dirs => {
    const commands = fs.readdirSync(`./commands/${dirs}`).filter(files => files.endsWith('.js'));

    for (const file of commands) {
        const command = require(`./commands/${dirs}/${file}`);
        console.log(`-> Loaded command ${command.name.toLowerCase()}`);
        client.commands.set(command.name.toLowerCase(), command);
    };
});

console.log(`Loading events...`);

const events = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of events) {
    const event = require(`./events/${file}`);
    console.log(`-> Loaded event ${file.split('.')[0]}`);
    client.on(file.split('.')[0], event.bind(null, client));
};

module.exports.cmdsSize = client.commands.size;

client.login(process.env.token);