import { PermissionsBitField, SlashCommandBuilder } from "discord.js";
import Command from "../../../structures/Command";
import { emojis } from "../../../../config.json";

export default {
    name: "disconnect",
    category: "Player",
    data: new SlashCommandBuilder()
        .setName("disconnect")
        .setDescription("Disconnects the bot from a voice channel."),
    async execute(bot, interaction) {
        if (!interaction.channel || !interaction.guild.members.me) throw new Error()

        const player = bot.playerManager.getPlayer(interaction.guild.id);

        if (!player || !player.isConnected()) {
            await interaction.reply(emojis.error + " **I am not connected to a voice channel.**");
            return;
        }

        const voiceChannelSize = interaction.member.voice.channel!.members.filter(m => !m.user.bot).size;
        if (voiceChannelSize > 1 && !interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            await interaction.reply(emojis.permission_error + " **This command requires you to have the Manage Channels permission to use it (being alone with the bot also works)**");
            return;
        }

        player.disconnect();

        await interaction.reply(emojis.success + " **Disconnected**");
    }
} as Command;