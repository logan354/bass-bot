const { ApplicationCommandOptionType, Client, CommandInteraction, CommandInteractionOptionResolver, PermissionsBitField, EmbedBuilder, } = require("discord.js");
const { getApplicationCommandID } = require("../../utils/util");

module.exports = {
    name: "help",
    category: "Utility",
    description: "Displays help information about Bass.",
    utilisation: "help [command]",
    options: [
        {
            name: "command",
            description: "Enter a command",
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],

    /**
     * @param {Client} client 
     * @param {CommandInteraction} interaction
     * @param {CommandInteractionOptionResolver} args 
     */
    async execute(client, interaction, args) {
        const botPermissionsFor = interaction.channel.permissionsFor(interaction.guild.members.me);
        if (!botPermissionsFor.has(PermissionsBitField.Flags.UseExternalEmojis)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Use External Emojis in** <#" + interaction.channel.id + ">");
        if (!botPermissionsFor.has(PermissionsBitField.Flags.EmbedLinks)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Embed Links in** <#" + interaction.channel.id + ">");

        if (!args.getString("command")) {
            // Command categories
            const music = client.slashCommands.filter(x => x.category === "Music").map((x) => "`" + x.name + "`");
            const utility = client.slashCommands.filter(x => x.category === "Utility").map((x) => "`" + x.name + "`");

            const embed = new EmbedBuilder()
                .setColor("Default")
                .setAuthor({
                    name: "Bass's Help Centre",
                    iconURL: client.config.app.logo
                })
                .setDescription("**Hello <@" + interaction.user.id + ">, welcome to the Help Centre.**\n\nBelow is a list of all my commands\nType </" + this.name + ":" + await getApplicationCommandID(client, this.name) + "> `" + this.utilisation.replace(`${this.name} `, "") + "` to get information about a specific command.")
                .setThumbnail(interaction.guild.iconURL())
                .setFields(
                    {
                        name: `**Music [${music.length}]**\n`,
                        value: music.join(", ")
                    },
                    {
                        name: `**Utility [${utility.length}]**\n`,
                        value: utility.join(", ")
                    }
                )
                .setTimestamp(new Date())
                .setFooter({
                    text: `Total Commands: ${music.length + utility.length}`
                });

            interaction.reply({ embeds: [embed] });
        } else {
            const command = client.slashCommands.get(args.getString("command").toLowerCase());

            if (!command) return interaction.reply(client.emotes.error + " **I could not find that command**");

            const embed = new EmbedBuilder()
                .setColor("Default")
                .setAuthor({
                    name: `${command.name.charAt(0).toUpperCase() + command.name.slice(1)} Command`,
                    iconURL: client.config.app.logo
                })
                .setDescription("Required arguments `<>`, optional arguments `[]`")
                .setThumbnail(interaction.guild.iconURL())
                .setFields(
                    {
                        name: "Description",
                        value: command.description,
                    },
                    {
                        name: "Category",
                        value: "`" + command.category + "`",
                        inline: true
                    },
                    {
                        name: "Utilisation",
                        value: "</" + command.name + ":" + await getApplicationCommandID(client, command.name) + "> `" + command.utilisation.replace(`${command.name} `, "") + "`",
                        inline: true
                    }
                )
                .setTimestamp(new Date());

            interaction.reply({ embeds: [embed] });
        }
    }
}