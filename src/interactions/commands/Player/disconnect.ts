import { PermissionsBitField, SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";
import { emojis } from "../../../../config.json";

export default {
    name: "disconnect",
    category: "Player",
    data: new SlashCommandBuilder()
        .setName("disconnect")
        .setDescription("Disconnects the bot from the voice channel. (Can require 'Manage Channels' permission)"),
    async execute(bot, interaction) {
        const player = bot.playerManager.getPlayer(interaction.guild.id);

        if (!player || !player.isConnected()) {
            await interaction.reply(emojis.error + " **I am not connected to a voice channel.**");
            return;
        }

        const voiceChannelMemberCount = interaction.member.voice.channel!.members.filter(x => !x.user.bot).size;

        if (voiceChannelMemberCount > 1 && !interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            await interaction.reply(emojis.permission_error + " **This command requires you to have the 'Manage Channels' permission (being alone with the bot also works)**");
            return;
        }

        player.disconnect();
        await interaction.reply(emojis.success + " **Disconnected**");
    }
} as Command;