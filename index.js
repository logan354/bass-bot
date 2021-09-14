const fs = require("fs");
const Discord = require("discord.js");

const client = new Discord.Client({ disableEveryone: false });

client.config = require("./config/bot");
client.emotes = client.config.emojis;
client.commands = new Discord.Collection();

client.queues = new Map();
client.cooldowns = new Map();

let commandCounter = 0;

//Loading general commands
fs.readdirSync("./commands").forEach(dirs => {
    const commands = fs.readdirSync(`./commands/${dirs}`).filter(files => files.endsWith(".js"));

    for (const file of commands) {
        const command = require(`./commands/${dirs}/${file}`);
        console.log(`Loading command ${file}`);
        commandCounter += 1;
        client.commands.set(command.name.toLowerCase(), command);
    };
});

//Loading message events
const events = fs.readdirSync("./events").filter(file => file.endsWith(".js"));

for (const file of events) {
    console.log(`Loading discord.js event ${file}`);
    const event = require(`./events/${file}`);
    client.on(file.split(".")[0], event.bind(null, client));
};

module.exports = { commandCounter }

client.login(client.config.discord.token);