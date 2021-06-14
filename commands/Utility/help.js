const { Util } = require("../../src/utils/Util");

module.exports = {
    name: "help",
    aliases: ["h"],
    category: "Utility",
    description: "Shows the bot's commands.",
    utilisation: "{prefix}help <command name>",

    execute(client, message, args) {
        if (!args[0]) {
            //Music
            const track = message.client.commands.filter(x => x.category == "Track").map((x) => "`" + x.name + "`").join(", "); //./commands/music/song
            const queue = message.client.commands.filter(x => x.category == "Queue").map((x) => "`" + x.name + "`").join(", "); //./commands/music/queue
            const utility = message.client.commands.filter(x => x.category == "Utility").map((x) => "`" + x.name + "`").join(", "); //./commands/music/premium          
            

            message.channel.send({
                embed: {
                    color: "BLACK",
                    title: "Help Pannel",
                    fields: [
                        { name: Util.emojis.playerFrozen + " **Music**", value: "\n**Track:** " + track + "\n**Queue: **" + queue + "\n\n" },
                        { name: client.emotes.utility + " **Utility**", value: "\n" + utility },
                    ],
                    thumbnail: { url: client.config.discord.smallLogo }
                },
            });
        } else {
            const command = message.client.commands.get(args.join(" ").toLowerCase()) || message.client.commands.find(x => x.aliases && x.aliases.includes(args.join(" ").toLowerCase()));

            if (!command) return message.channel.send(client.emotes.success + " **I did not find this command**");

            message.channel.send({
                embed: {
                    color: "BLACK",
                    title: "Help Pannel",
                    fields: [
                        { name: "Name", value: command.name, inline: true },
                        { name: "Category", value: command.category, inline: true },
                        { name: "Aliase(s)", value: command.aliases.length < 1 ? "None" : command.aliases.join(", "), inline: true },
                        { name: "Description", value: command.description, inline: true },
                        { name: "Utilisation", value: command.utilisation.replace("{prefix}", client.config.discord.prefix), inline: true },
                    ],
                    description: "Find information on the command provided.\nMandatory arguments `[]`, optional arguments `<>`.",
                }
            });
        };
    },
};