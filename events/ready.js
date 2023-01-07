const { Client } = require("discord.js");

/**
 * @param {Client} client 
 */
module.exports = async (client) => {
    console.log(`Logged to the client ${client.user.username}\n-> Ready on ${client.guilds.cache.size} servers for a total of ${client.users.cache.size} users`);

    client.user.setPresence({
        activities: [
            {
                name: `🎧 ${client.config.app.prefix}play`,
                type: "LISTENING"
            }
        ],
        status: "online"
    });

    /**
     * Registering all slash commands
     */
    console.log("Registering slash commands...");

    const data = [];
    client.slashCommands.forEach((slashCommand) => data.push(slashCommand));
    client.application.commands.set(data);
    

    console.log("Successful startup...");
}