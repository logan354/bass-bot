import { SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";
import { emojis } from "../../../../config.json";
import { QueueableAudioMediaType } from "../../../utils/constants";
import Track from "../../../structures/models/Track";
import { convertTimestamp, formatTimestamp } from "../../../utils/util";

export default {
    name: "seek",
    category: "Player",
    data: new SlashCommandBuilder()
        .setName("seek")
        .setDescription("Jumps to a specific timestamp in the currently playing item.")
        .addStringOption(option =>
            option.setName("timestamp")
                .setDescription("Examples: 10, 10s, 0:10")
                .setRequired(true),
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

        if (player.queue.items[0].type !== QueueableAudioMediaType.TRACK) {
            await interaction.reply(emojis.error + " **Can only seek a track.");
            return;
        }

        const track = player.queue.items[0] as Track;

        if (track.isLiveStream) {
            await interaction.reply(emojis.error + " **Cannot seek a live song.**");
            return;
        }

        const timestampOption = interaction.options.getString("timestamp")!;
        let milliseconds = 0;

        const convertedTimestamp = convertTimestamp(timestampOption);

        if (!convertedTimestamp) {
            await interaction.reply(emojis.error + " **Error invalid time.** Examples: `10`, `10s`, `0:10`.");
            return;
        }
        else {
            milliseconds = convertedTimestamp;
        }

        const playbackDuration = player.playbackDuration()!

        // Fast-forward and rewind commands come under seek command
        if (interaction.commandName === "fast-forward") {
            if (playbackDuration + milliseconds > track.duration) {
                await interaction.reply(emojis.error + " **Time must be in the range of the song.**");
                return;
            }

            await player.playTrack(track, { seek: playbackDuration + milliseconds });
            await interaction.reply(emojis.fast_forward + " **Fast-Forwarded to** `" + formatTimestamp(playbackDuration + milliseconds) + "`");
        }
        else if (interaction.commandName === "rewind") {
            if (playbackDuration - milliseconds < 0) {
                await interaction.reply(emojis.error + " **Time must be in the range of the song.**");
                return;
            }

            await player.playTrack(track, { seek: playbackDuration - milliseconds });
            await interaction.reply(emojis.rewind + " **Rewinded to** `" + formatTimestamp(playbackDuration - milliseconds) + "`");
        }
        else {
            if (milliseconds < 0 || milliseconds > track.duration) {
                await interaction.reply(emojis.error + " **Time must be in the range of the song.**");
                return;
            }

            let seekEmoji;
            if (milliseconds > playbackDuration) {
                seekEmoji = emojis.fast_forward;
            }
            else {
                seekEmoji = emojis.rewind;
            }

            await player.playTrack(track, { seek: milliseconds });
            await interaction.reply(seekEmoji + " **Seeked to** `" + formatTimestamp(milliseconds) + "`");
        }
    }
} as Command;