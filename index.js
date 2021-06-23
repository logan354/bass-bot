//Decleared public variables
const fs = require("fs");
const Discord = require("discord.js");

const { Player } = require("./src/Player");


//Client variables
const client = new Discord.Client({ disableEveryone: false });

client.config = require("./config/bot");
client.emotes = client.config.emojis;
client.commands = new Discord.Collection();

client.player = new Player();
client.queue = new Map();
client.cooldownTimeout = new Map();

let commandCounter = 0;


//Loading general commands
fs.readdirSync("./commands").forEach(dirs => {
    const commands = fs.readdirSync(`./commands/${dirs}`).filter(files => files.endsWith(".js"));

    for (const file of commands) {
        const command = require(`./commands/${dirs}/${file}`);
        console.log(`Loading command ${file}`);
        commandCounter += 1
        client.commands.set(command.name.toLowerCase(), command);
    };
});

//Loading music commands
fs.readdirSync("./commands/Music").forEach(dirs => {
    const commands = fs.readdirSync(`./commands/Music/${dirs}`).filter(files => files.endsWith(".js"));

    for (const file of commands) {
        const command = require(`./commands/Music/${dirs}/${file}`);
        console.log(`Loading command ${file}`);
        commandCounter += 1
        client.commands.set(command.name.toLowerCase(), command);
    };
});

<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes

//Export commandCounter
module.exports = { commandCounter }


//Login to Discord API
client.login(client.config.discord.token);

