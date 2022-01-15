const { Client, Message, MessageEmbed } = require("discord.js");

module.exports = {
    name: "invite",
    aliases: ["links"],
    category: "Utility",
    description: "Shows information on how to invite Bass",
    utilisation: "{prefix}invite",

    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {string[]} args 
     */
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