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
            .setColor("2f3136")
            .setAuthor("About Me")
            .setDescription(`The best music bot for Discord. With the \nhighest quality audio and support for \nYouTube, Spotify and Soundcloud!\n\n[Invite the bot here](${client.config.app.invite})`)
            .setThumbnail(message.guild.iconURL())
            .setTimestamp(new Date())
            .setFooter("Thanks For Choosing Bass", client.config.app.logo);

        message.channel.send({ embeds: [embed] });
    },

    slashCommand: {
        options: [],

        execute(client, interaction, args) {
            const embed = new MessageEmbed()
                .setColor("2f3136")
                .setAuthor("About Me")
                .setDescription(`The best music bot for Discord. With the \nhighest quality audio and support for \nYouTube, Spotify and Soundcloud!\n\n[Invite the bot here](${client.config.app.invite})`)
                .setThumbnail(message.guild.iconURL())
                .setTimestamp(new Date())
                .setFooter("Thanks For Choosing Bass", client.config.app.logo);

            interaction.reply({ embeds: [embed] });
        }
    }
}
