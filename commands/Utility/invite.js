module.exports = {
    name: "invite",
    aliases: ["links"],
    category: "Utility",
    description: "Shows Bass's official links!",
    utilisation: "{prefix}invite",

    execute(client, message) {

        message.channel.send({
            embed: {
                color: "BLACK",
                title: "About Me",
                description: `The best music bot for Discord. With the \nhighest quality audio and support for \nYouTube, Spotify and Soundcloud!\n\n[Invite the bot here](${client.config.discord.invite})`,
                thumbnail: { url: client.config.discord.logo } ,
            }
        });

    }
}