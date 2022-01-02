const { MessageEmbed } = require("discord.js");

module.exports = {
    name: "invite",
    aliases: ["links"],
    category: "Utility",
    description: "Shows Bass's official links!",
    utilisation: "{prefix}invite",
    permissions: {
        channel: [],
        member: [],
    },

    execute(client, message, args) {
        const embed = new MessageEmbed()
            .setColor("BLACK")
            .setAuthor({
                name: "About Me"
            })
            .setDescription(client.config.app.slogan.split(".").join(".\n"))
            .setThumbnail(message.guild.iconURL())
            .setFields(
                {
                    name: "Invite",
                    value: "[`Click Here`](" + client.config.app.invite + ")"
                },
                {
                    name: "Support Server",
                    value: "[`Click Here`](" + client.config.app.support_server + ")"
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