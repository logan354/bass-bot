//Decleared public variables
const fs = require("fs");
const discord = require("discord.js");

const client = new discord.Client({ disableEveryone: false });

client.config = require("./config/bot");
client.emotes = client.config.emojis;
client.filters = client.config.filters;
client.commands = new discord.Collection();

client.queue = new Map();


let commandCounter = 0;

//Loading all commands
fs.readdirSync("./commands").forEach(dirs => {
    const commands = fs.readdirSync(`./commands/${dirs}`).filter(files => files.endsWith(".js"));

    for (const file of commands) {
        const command = require(`./commands/${dirs}/${file}`);
        console.log(`Loading command ${file}`);
        commandCounter += 1
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
//----------------------------------------------------------------------------

//Export commandCounter
module.exports = { commandCounter }

//Login to Discord API
client.login(client.config.discord.token);

