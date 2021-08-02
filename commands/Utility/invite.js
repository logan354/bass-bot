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
                title: "Invite",
                description: "__**Bass**__\nThe best music bot for Discord. With the highest quality audio and support for YouTube, Spotify and Soundcloud!\n\n__**Titanium**__\nIf you'd like to enjoy the power of Titanium\nright at home, you can invite me to your own server.\n\n" + `[Add Bass Here](${client.config.discord.invite})\n[Add Titanium Here](${client.config.discord.titaniumInvite})`,
                thumbnail: { url: client.config.discord.aiLogo } ,
                image: { url: client.config.discord.communityLogo } 
            },
        })

    },
};