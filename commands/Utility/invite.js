const { Util } = require("../../src/utils/Util")

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
                author: {
                    name: "Invite",
                },
                description: "If you'd like to enjoy the power of Bass\nright at home, you can " + `[invite](${client.config.discord.invite})` + " me to your own server.\n\n" + `[Bass invite](${client.config.discord.invite})`,
                thumbnail: { url: client.config.discord.smallLogo } ,
                image: { url: client.config.discord.logo } 
            },
        })

    },
};