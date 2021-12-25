const { MessageEmbed } = require("discord.js");

const { formatFormalTime } = require("../../utils/formats");

const package = require("../../package.json");

module.exports = {
    name: "stats",
    category: "Utility",
    description: "Shows the bot's statistics",
    utilisation: "{prefix}stats",
    permissions: {
        channel: [],
        member: [],
    },

    execute(client, interaction, args) {
        const memory = 512;
        
        const embed = new MessageEmbed()
            .setColor("BLACK")
            .setAuthor("-- Bass's Statistics --", client.config.app.logo)
            .setFields(
                {
                    name: ":joystick: Bot Statistics",
                    value: `Servers: **${client.guilds.cache.size}**\nUsers: **${client.users.cache.size}**\nChannels: **${client.channels.cache.size}**`
                },
                {
                    name: ":pencil: Bot Information",
                    value: `Creator: **Block354#3452**\nVersion: **${package.version}**\nLines of Code: **?**\nNumber of Commands: **${client.commands.size}**`
                },
                {
                    name: ":desktop: Hosting Statistics",
                    value: `Memory Usage: **${Math.trunc((process.memoryUsage().heapTotal / (memory * 1000000)) * 100)}% (${memory}mb)**\nUptime: **${formatFormalTime(client.uptime)}**\nDiscord.js: **v${package.dependencies["discord.js"].split("^")[1]}**\nOperating System: **${process.platform}**`
                }
            )
            .setTimestamp(new Date())
            .setFooter("Thanks For Choosing Bass", client.config.app.logo);

        interaction.reply({ embeds: [embed] });
    }
}