const { Client, CommandInteraction, CommandInteractionOptionResolver, PermissionsBitField, EmbedBuilder } = require("discord.js");
const { formatFormalTime } = require("../../utils/formats");
const { version, dependencies } = require("../../package.json");

module.exports = {
    name: "statistics",
    category: "Utility",
    description: "Displays statistic information about Bass.",
    utilisation: "statistics",

    /**
     * @param {Client} client 
     * @param {CommandInteraction} interaction
     * @param {CommandInteractionOptionResolver} args 
     */
    execute(client, interaction, args) {
        const memory = 512;

        const botPermissionsFor = interaction.channel.permissionsFor(interaction.guild.members.me);
        if (!botPermissionsFor.has(PermissionsBitField.Flags.EmbedLinks)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Embed Links in** <#" + interaction.channel.id + ">");

        const embed = new EmbedBuilder()
            .setColor("Default")
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
                    value: `Creator: **Block354#3452**\nVersion: **${version}**\nLines of Code: **?**\nNumber of Commands: **${client.commands.size}**`
                },
                {
                    name: ":desktop: Hosting Statistics",
                    value: `Memory Usage: **${Math.trunc((process.memoryUsage().heapTotal / (memory * 1000000)) * 100)}% (${memory}mb)**\nUptime: **${formatFormalTime(client.uptime)}**\nDiscord.js: **v${dependencies["discord.js"].split("^")[1]}**\nOperating System: **${process.platform}**`
                }
            )
            .setTimestamp(new Date())
            .setFooter({
                text: "Thanks For choosing Bass",
                iconURL: client.config.app.logo
            });

        interaction.reply({ embeds: [embed] });
    }
}