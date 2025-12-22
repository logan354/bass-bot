import { EmbedBuilder, PermissionsBitField, SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";
import { emojis } from "../../../../config.json";
import { version } from "../../../../package.json"

export default {
    name: "help",
    category: "Utility",
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("The command guide."),
    async execute(bot, interaction) {
        if (!interaction.channel || !interaction.guild.members.me) throw new Error();

        const botPermissionsFor = interaction.channel.permissionsFor(interaction.guild.members.me);
        if (!botPermissionsFor.has(PermissionsBitField.Flags.EmbedLinks)) {
            interaction.reply(emojis.permission_error + " **I do not have permission to Embed Links in** <#" + interaction.channel.id + ">");
            return;
        }

        await interaction.deferReply();

        const applicationCommands = await bot.application.commands.fetch();

        let commandList = "";
        let category = "";

        for (const [commandName, command] of bot.commands) {
            const applicationCommand = applicationCommands.find((x) => x.name === commandName)!;

            const commandMention = `</${applicationCommand.name}:${applicationCommand.id}>`;
            const options = applicationCommand.options ? applicationCommand.options.map((x: any) => x.required ? "`<" + x.name + ">`" : "`[" + x.name + "]`").join(" ") : "";

            if (category !== command.category) {
                commandList += `\n\n**${command.category}**`;
                category = command.category;
            }

            commandList += `\n${commandMention} ${options}`;
        }

        const embed = new EmbedBuilder()
            .setTitle("Command Guide")
            .setThumbnail(bot.user.avatarURL())
            .setDescription(`**Hello <@${interaction.user.id}>,**\nBelow is a list of all the commands.\n*Format: **name** \`<required>\` \`[optional]\`*${commandList}`)
            .setFooter({
                text: "v" + version
            })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
} as Command;