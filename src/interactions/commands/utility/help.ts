import { EmbedBuilder, PermissionsBitField, SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";
import { emojis } from "../../../../config.json";
import { formatTitleCase } from "../../../utils/util";

export default {
    name: "help",
    category: "Utility",
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Command guide for one or all commands.")
        .addStringOption(option =>
            option.setName("command")
                .setDescription("The name of the command.")
                .setRequired(false)
        ),
    async execute(bot, interaction) {
        if (!interaction.channel || !interaction.guild.members.me) throw new Error();

        const botPermissionsFor = interaction.channel.permissionsFor(interaction.guild.members.me);
        if (!botPermissionsFor.has(PermissionsBitField.Flags.EmbedLinks)) {
            interaction.reply(emojis.permission_error + " **I do not have permission to Embed Links in** <#" + interaction.channel.id + ">");
            return;
        }

        const commandOpt = interaction.options.getString("command");

        if (commandOpt) {
            const command = bot.commands.get(commandOpt);

            if (!command) {
                await interaction.editReply(emojis.error + " **I could not find that command**");
                return;
            }

            await interaction.deferReply();

            const applicationCommands = await interaction.guild.commands.fetch();

            let applicationCommand;

            for (const x of applicationCommands.values()) {
                if (x.name === commandOpt.toLowerCase()) {
                    applicationCommand = x;
                }
            }

            let commandLink = `</${applicationCommand?.name}:${applicationCommand?.id}>`;
            let optionsStr = applicationCommand?.options ? applicationCommand?.options.map((x: any) => x.required ? "`<" + x.name + ">`" : "`[" + x.name + "]`") : "";

            const embed = new EmbedBuilder()
                .setTitle(`${formatTitleCase(command.name.replace("-", " "))} Command`)
                .setThumbnail(interaction.guild.iconURL())
                .setDescription(applicationCommand!.description)
                .setFields(
                    {
                        name: "Category",
                        value: "`" + command.category + "`",
                        inline: true
                    },
                    {
                        name: "Command",
                        value: `${commandLink} ${optionsStr}`
                    }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
        else {
            await interaction.deferReply();

            const applicationCommands = await interaction.guild.commands.fetch();

            let applicationCommand;

            for (const x of applicationCommands.values()) {
                if (x.name === this.name) {
                    applicationCommand = x;
                }
            }

            let commandLink = `</${applicationCommand?.name}:${applicationCommand?.id}>`;
            let optionsStr = applicationCommand?.options ? applicationCommand?.options.map((x: any) => x.required ? "`<" + x.name + ">`" : "`[" + x.name + "]`") : "";

            const embed = new EmbedBuilder()
                .setTitle("Command Guide")
                .setThumbnail(interaction.guild.iconURL())
                .setDescription(`**Hello <@${interaction.user.id}>,**\nBelow is a list of all the commands.\nUse ${commandLink} ${optionsStr} for details about each command.`)
                .setTimestamp();

            const commandsByCategory: Map<string, Array<Command>> = new Map();

            for (const [commandName, command] of bot.commands) {
                if (commandsByCategory.get(command.category)) {
                    const commandsArr = commandsByCategory.get(command.category)!
                    commandsArr.push(command);

                    commandsByCategory.set(command.category, commandsArr);
                }
                else {
                    commandsByCategory.set(command.category, [command]);
                }
            }

            for (const [category, command] of commandsByCategory) {
                embed.addFields(
                    {
                        name: category,
                        value: command.map((x) => "`" + x.name + "`").join(", "),
                    }
                )
            }

            await interaction.editReply({ embeds: [embed] });
        }
    }
} as Command;