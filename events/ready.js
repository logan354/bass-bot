module.exports = async (client) => {
    console.log(`Logged to the client ${client.user.username}\n-> Ready on ${client.guilds.cache.size} servers for a total of ${client.users.cache.size} users`);

    client.user.setPresence({
        activity: {
            name: `🎧 ${client.config.app.prefix}play`,
            type: "LISTENING"
        },
        status: "idle"
    });
}