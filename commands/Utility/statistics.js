const { Client, Message, Permissions, MessageEmbed } = require("discord.js");

const { formatFormalTime } = require("../../utils/formats");

const package = require("../../package.json");

module.exports = {
    name: "statistics",
    aliases: ["stats"],
    category: "Utility",
    description: "Shows information about Bass statistics",
    utilisation: "{prefix}stats",

    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {string[]} args 
     */
    execute(client, message, args) {
        const memory = 512;

        const botPermissionsFor = message.channel.permissionsFor(message.guild.me);
        if (!botPermissionsFor.has(Permissions.FLAGS.EMBED_LINKS)) return message.channel.send(client.emotes.permissionError + " **I do not have permission to Embed Links in** " + "`" + message.channel.name + "`");

        const embed = new MessageEmbed()
            .setColor("BLACK")
            .setAuthor({
                name: "-- Bass's Statistics --",
                iconURL: client.config.app.logo
            })
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
            .setFooter({
                text: "Thanks For Choosing Bass",
                iconURL: client.config.app.logo
            });

        message.channel.send({ embeds: [embed] });
    }
}