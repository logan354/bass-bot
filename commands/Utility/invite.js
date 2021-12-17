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
            .setAuthor("About Me")
            .setDescription(`A music bot for Discord. \nWith support for YouTube, Spotify and Soundcloud!\n\n[Invite the bot here](${client.config.app.invite})`)
            .setThumbnail(message.guild.iconURL())
            .setTimestamp(new Date())
            .setFooter("Thanks For Choosing Bass", client.config.app.logo);

        message.channel.send({ embeds: [embed] });
    }
}