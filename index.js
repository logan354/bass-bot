const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();

const { Client, GatewayIntentBits, Collection, REST, Routes } = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.config = require("./config");
client.emotes = client.config.emojis;

client.commands = new Collection();
client.slashCommands = new Collection();
client.components = new Collection();

client.subscriptions = new Map();

/**
 * Importing all commands
 */
console.log("Loading commands...");

fs.readdirSync("./commands").forEach(dirs => {
    const commands = fs.readdirSync(`./commands/${dirs}`).filter(files => files.endsWith(".js"));

    for (const file of commands) {
        const command = require(`./commands/${dirs}/${file}`);
        console.log(`-> Loaded command ${command.name.toLowerCase()}`);
        client.commands.set(command.name.toLowerCase(), command);
    }
});

/**
 * Importing all slash commands
 */
console.log("Loading slash commands...");

fs.readdirSync("./slashCommands").forEach(dirs => {
    const slashCommands = fs.readdirSync(`./slashCommands/${dirs}`).filter(files => files.endsWith(".js"));

    for (const file of slashCommands) {
        const slashCommand = require(`./slashCommands/${dirs}/${file}`);
        console.log(`-> Loaded slash command ${slashCommand.name.toLowerCase()}`);
        client.slashCommands.set(slashCommand.name.toLowerCase(), slashCommand);
    }
});

/**
 * Importing all components
 */
// console.log("Loading components...");

// fs.readdirSync("./components").forEach(dirs => {
//     const components = fs.readdirSync(`./components/${dirs}`).filter(files => files.endsWith(".js"));

//     for (const file of components) {
//         const component = require(`./components/${dirs}/${file}`);
//         console.log(`-> Loaded component(${dirs}) ${file.split(".")[0]}`);
//         client.components.set(file.split(".")[0], component);
//     }
// });

/**
 * Listening for all events
 */
console.log("Loading events...");

const events = fs.readdirSync("./events").filter(file => file.endsWith(".js"));

for (const file of events) {
    const event = require(`./events/${file}`);
    console.log(`-> Loaded event ${file.split(".")[0]}`);
    client.on(file.split(".")[0], event.bind(null, client));
}

/**
 * Deploying application commands
 */
console.log("Registering slash commands...");

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(process.env.token);

// and deploy your commands!
(async () => {
    try {
        console.log(`Started refreshing ${client.slashCommands.size} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Routes.applicationCommands(client.config.app.clientId),
            { body: client.slashCommands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();

client.login(process.env.token);