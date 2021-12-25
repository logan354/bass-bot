const { MessageEmbed } = require("discord.js");

module.exports = {
    name: "help",
    category: "Utility",
    description: "Shows the bot's commands.",
    utilisation: "{prefix}help <command>",
    permissions: {
        channel: [],
        member: [],
    },
    options: [
        {
            name: "command",
            description: "Enter a command name",
            required: false,
            type: "STRING"
        }
    ],

    execute(client, interaction, args) {
        if (!args.getString("command")) {
            // Command categories
            const track = client.commands.filter(x => x.category == "Track").map((x) => "`" + x.name + "`");
            const queue = client.commands.filter(x => x.category == "Queue").map((x) => "`" + x.name + "`");
            const premium = client.commands.filter(x => x.category == "Premium").map((x) => "`" + x.name + "`");
            const utility = client.commands.filter(x => x.category == "Utility").map((x) => "`" + x.name + "`");

            const embed = new MessageEmbed()
                .setColor("BLACK")
                .setAuthor("Bass Commands", client.config.app.logo)
                .setDescription("My current prefix in this server is `" + client.config.app.prefix + "` type `" + this.utilisation.replace("{prefix}", client.config.app.prefix) + "` to get information about a specific command.")
                .setThumbnail(interaction.guild.iconURL())
                .setFields(
                    {
                        name: `**Track [${track.length}]**\n`,
                        value: track.join(", ")
                    },
                    {
                        name: `**Queue [${queue.length}]**\n`,
                        value: queue.join(", ")
                    },
                    {
                        name: `**Premium [${premium.length}]**\n`,
                        value: premium.join(", ")
                    },
                    {
                        name: `**Utility [${utility.length}]**\n`,
                        value: utility.join(", ")
                    }
                )
                .setTimestamp(new Date())
                .setFooter(`Total Commands: ${track.length + queue.length + premium.length + utility.length}`);

            interaction.reply({ embeds: [embed] });
        } else {
            const command = client.commands.get(args.getString("command").toLowerCase()) || client.commands.find(x => x.aliases && x.aliases.includes(args.getString("command").toLowerCase()));

            if (!command) return interaction.reply(client.emotes.error + " **I could not find that command**");

            const embed = new MessageEmbed()
                .setColor("BLACK")
                .setAuthor(`${command.name.charAt(0).toUpperCase() + command.name.slice(1)} Command`, client.config.app.logo)
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
                        name: "Aliase(s)",
                        value: command.aliases.length === 0 ? "`None`" : command.aliases.map((aliase) => "`" + aliase + "`").join(", "),
                        inline: true
                    },
                    {
                        name: "Utilisation",
                        value: "`" + command.utilisation.replace("{prefix}", client.config.app.prefix) + "`",
                        inline: true
                    }
                )
                .setTimestamp(new Date());

            interaction.reply({ embeds: [embed] });
        }
    }
}