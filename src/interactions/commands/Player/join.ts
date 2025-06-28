import { PermissionsBitField, SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";
import { emojis } from "../../../../config.json";

export default {
    name: "join",
    category: "Player",
    data: new SlashCommandBuilder()
        .setName("join")
        .setDescription("Connects the bot to a voice channel."),
    async execute(bot, interaction) {
        const textChannel = interaction.channel;
        const voiceChannel = interaction.member.voice.channel;

        if (!textChannel || !interaction.guild.members.me) throw new Error();

        const botPermissionsFor = textChannel.permissionsFor(interaction.guild.members.me);
        if (!botPermissionsFor.has(PermissionsBitField.Flags.UseExternalEmojis)) {
            await interaction.reply(emojis.permission_error + " **I do not have permission to Use External Emojis in** <#" + textChannel.id + ">");
            return;
        }

        if (!voiceChannel) {
            await interaction.reply(emojis.error + " **You have to be in a voice channel to use this command**");
            return;
        }

        const permissionsForVoice = voiceChannel.permissionsFor(interaction.guild.members.me);
        if (!permissionsForVoice.has(PermissionsBitField.Flags.Connect)) {
            await interaction.reply(" **I do not have permission to Connect in** <#" + voiceChannel.id + ">");
            return;
        }

        let player = bot.playerManager.getPlayer(interaction.guild.id);

        if (!player) player = bot.playerManager.createPlayer(interaction.guild.id, textChannel);

        await interaction.reply(emojis.neutral + " **Connecting...**");

        try {
            await player.connect(voiceChannel);
        }
        catch (e) {
            await interaction.editReply(emojis.error + " **An error occured while connecting to** <#" + voiceChannel.id + ">");
            return;
        }

        await interaction.editReply(emojis.success + " **Connected to <#" + voiceChannel.id + "> and bound to** <#" + textChannel.id + ">");
    }
} as Command;