const pack = require("../../package.json")

module.exports = {
    name: "stats",
    aliases: [],
    category: "Utility",
    description: "Shows the bot's statistics",
    utilisation: "{prefix}stats",

    execute(client, message) {

        const { commandCounter } = require("../../");

        message.channel.send({
            embed: {
                color: "BLACK",
                author: { name: "-- Bass's Stats --" },
                fields: [
                    { name: ":joystick: Bot Statistics", value: `Servers: **${client.guilds.cache.size}**\nUsers: **${client.users.cache.size}**\nChannels: **${client.channels.cache.size}**` },
                    { name: ":pencil: Bot Information", value: `Creator: **Block354#3452**\nVersion: **${pack.version}**\nLines of Code: **?**\nNumber of Commands: **${commandCounter}**` },
                    { name: ":desktop: Hosting Statistics", value: `Service: **Heroku**\nRegion: **United States**\nStack: **heroku-20**\nFramework: **Node.js**\nDiscord.js: **v${pack.dependencies["discord.js"].split("^")[1]}**` }
                ],
                timestamp: new Date(),
            },

        });
    },
};

