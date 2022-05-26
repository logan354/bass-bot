const { Client, CommandInteraction, CommandInteractionOptionResolver, Permissions, MessageEmbed } = require("discord.js");

const { formatFormalTime } = require("../../utils/formats");

const package = require("../../package.json");

module.exports = {
    name: "statistics",
    category: "Utility",
    description: "Shows information about Bass's statistics",
    /**
     * @param {Client} client 
     * @param {CommandInteraction} interaction
     * @param {CommandInteractionOptionResolver} args 
     */
    execute(client, interaction, args) {
        const memory = 512;

        const botPermissionsFor = interaction.channel.permissionsFor(interaction.guild.me);
        if (!botPermissionsFor.has(Permissions.FLAGS.EMBED_LINKS)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Embed Links in** " + "`" + interaction.channel.name + "`");

        const embed = new MessageEmbed()
            .setColor("BLACK")
            .setAuthor({
                name: "-- Bass Statistics --",
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

        interaction.reply({ embeds: [embed] });
    }
}