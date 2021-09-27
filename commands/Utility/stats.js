const { formatFormalTime } = require("../../utils/Formatting");
const package = require("../../package.json");
const index = require("../../");

module.exports = {
    name: "stats",
    aliases: [],
    category: "Utility",
    description: "Shows the bot's statistics",
    utilisation: "{prefix}stats",

    execute(client, message) {
        const availableMemory = 512;

        message.channel.send({
            embed: {
                color: "BLACK",
                title: "-- Bass's Stats --",
                thumbnail: { url: client.config.app.logo },
                fields: [
                    { name: ":joystick: Bot Statistics", value: `Servers: **${client.guilds.cache.size}**\nUsers: **${client.users.cache.size}**\nChannels: **${client.channels.cache.size}**` },
                    { name: ":pencil: Bot Information", value: `Creator: **Block354#3452**\nVersion: **${package.version}**\nLines of Code: **?**\nNumber of Commands: **${index.cmdsSize}**` },
                    { name: ":desktop: Hosting Statistics", value: `Memory Usage: **${Math.trunc((process.memoryUsage().heapTotal / (availableMemory * 1000000)) * 100)}% (${availableMemory}mb)**\nUptime: **${formatFormalTime(client.uptime)}**\nDiscord.js: **v${package.dependencies["discord.js"].split("^")[1]}**\nOperating System: **${process.platform}**` }
                ],
            }
        });
    }
}

