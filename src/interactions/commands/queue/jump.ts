import { PermissionsBitField, SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";
import { emojis } from "../../../../config.json";

export default {
    name: "jump",
    category: "Queue",
    data: new SlashCommandBuilder()
        .setName("jump")
        .setDescription("Clears the queue.")
        .addNumberOption(option =>
            option.setName("position")
                .setDescription("Queue position.")
                .setRequired(true)
        ),
    async execute(bot, interaction) {
        const player = bot.playerManager.getPlayer(interaction.guild.id);

        if (!interaction.member.voice.channel) {
            await interaction.reply(emojis.error + " **You have to be in a voice channel to use this command.**");
            return;
        }

        if (!player || !player.voiceChannel) {
            await interaction.reply(emojis.error + " **I am not connected to a voice channel.**");
            return;
        }

        if (interaction.member.voice.channel.id !== player.voiceChannel.id) {
            await interaction.reply(emojis.error + " **You need to be in the same voice channel as Bass to use this command.**");
            return;
        }

        if (!player.isPlaying()) {
            await interaction.reply(emojis.error + " **The player is not playing.**");
            return;
        }

        const voiceChannel = await player.voiceChannel.fetch();
        const voiceChannelMemberCount = voiceChannel.members.filter(x => !x.user.bot).size;

        if (voiceChannelMemberCount > 1 && !interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            await interaction.reply(emojis.permission_error + " **This command requires you to have the 'Manage Channels' permission (being alone with the bot also works).**");
            return;
        }

        const positionOption = interaction.options.getNumber("position")!;

        player.skipToNext(positionOption);
        await interaction.reply(`${emojis.next} **Jumped to \`${positionOption}\`**`)
    }
} as Command;