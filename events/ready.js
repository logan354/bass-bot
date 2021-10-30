const fs = require("fs");

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

    console.log("Registering slash commands...");

    fs.readdirSync("./commands").forEach(dirs => {
        const commands = fs.readdirSync(`./commands/${dirs}`).filter(files => files.endsWith(".js"));

        for (const file of commands) {
            const command = require(`../commands/${dirs}/${file}`);
            console.log(`-> Loaded command ${command.name.toLowerCase()}`);
            client.guilds.cache.get("718350376344223754").commands.create({
                name: command.name,
                description: command.description,
                options: command.slashCommand.options
            });
        }
    });

    // Deleting commands client.guilds.cache.get("718350376344223754").commands.delete(" Command id");

    console.log("Successful startup...");
}