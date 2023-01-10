const { Client, ActivityType } = require("discord.js");

/**
 * @param {Client} client 
 */
module.exports = async (client) => {
    console.log(`Logged to the client ${client.user.username}\n-> Ready on ${client.guilds.cache.size} servers for a total of ${client.users.cache.size} users`);

    client.user.setPresence({
        activities: [
            {
                name: "/play",
                type: ActivityType.Playing
            }
        ],
        status: "online"
    });
}