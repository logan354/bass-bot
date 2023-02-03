const { Client, CommandInteraction, CommandInteractionOptionResolver, PermissionsBitField, EmbedBuilder } = require("discord.js");

module.exports = {
    name: "invite",
    category: "Utility",
    description: "Displays invite information about Bass.",
    utilisation: "invite",

    /**
     * @param {Client} client 
     * @param {CommandInteraction} interaction
     * @param {CommandInteractionOptionResolver} args 
     */
    execute(client, interaction, args) {
        const botPermissionsFor = interaction.channel.permissionsFor(interaction.guild.members.me);
        if (!botPermissionsFor.has(PermissionsBitField.Flags.EmbedLinks)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Embed Links in** <#" + interaction.channel.id + ">");

        const embed = new EmbedBuilder()
            .setColor("Default")
            .setAuthor({
                name: "About Me"
            })
            .setDescription(client.config.app.slogan.split(".").join(".\n"))
            .setThumbnail(interaction.guild.iconURL())
            .setFields(
                {
                    name: "Invite",
                    value: "[`Click Here`](" + client.config.app.invite + ")"
                },
                {
                    name: "Support Server",
                    value: "[`Click Here`](" + client.config.app.supportServer + ")"
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