const pack = require("../../package.json");
const { formatFormalTime } = require("../../utils/Formatting");

module.exports = {
    name: "stats",
    aliases: [],
    category: "Utility",
    description: "Shows the bot's statistics",
    utilisation: "{prefix}stats",

    execute(client, message) {
        const { commandCounter }  = require("../../");
        const availableMemory = 512;

        message.channel.send({
            embed: {
                color: "BLACK",
                title: "-- Bass's Stats --",
                thumbnail: { url: client.config.discord.logo },
                fields: [
                    { name: ":joystick: Bot Statistics", value: `Servers: **${client.guilds.cache.size}**\nUsers: **${client.users.cache.size}**\nChannels: **${client.channels.cache.size}**` },
                    { name: ":pencil: Bot Information", value: `Creator: **Block354#3452**\nVersion: **${pack.version}**\nLines of Code: **?**\nNumber of Commands: **${commandCounter}**` },
                    { name: ":desktop: Hosting Statistics", value: `Memory Usage: **${Math.trunc((process.memoryUsage().heapTotal / (availableMemory * 1000000)) * 100)}% (${availableMemory}mb)**\nUptime: **${formatFormalTime(client.uptime)}**\nDiscord.js: **v${pack.dependencies["discord.js"].split("^")[1]}**\nOperating System: **${process.platform}**` }
                ],
            }
        });
    }
}

