import { EmbedBuilder, PermissionsBitField, SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";
import { emojis } from "../../../../config.json";
import { createQueueEmptyMessage, createTrackString } from "../../../utils/common";
import { getAudioMediaSourceEmbedColor, getAudioMediaSourceIconURL } from "../../../utils/util";
import Track from "../../../structures/models/Track";
import { QueueableAudioMediaType } from "../../../utils/constants";

export default {
    name: "now-playing",
    category: "Queue",
    data: new SlashCommandBuilder()
        .setName("now-playing")
        .setDescription("The track currently playing."),
    async execute(bot, interaction) {
        if (!interaction.channel || !interaction.guild.members.me) throw new Error();

        const botPermissionsFor = interaction.channel.permissionsFor(interaction.guild.members.me);
        if (!botPermissionsFor.has(PermissionsBitField.Flags.EmbedLinks)) {
            await interaction.reply(emojis.permission_error + " **I do not have permission to Embed Links in** <#" + interaction.channel.id + ">");
            return;
        }

        const player = bot.playerManager.getPlayer(interaction.guild.id);

        if (!player || !player.voiceChannel) {
            interaction.reply(emojis.error + " **I am not connected to a voice channel.**");
            return;
        }

        if (player.queue.isEmpty()) {
            await interaction.reply(await createQueueEmptyMessage(bot));
            return;
        }

        if (!player.isPlaying()) {
            await interaction.reply(emojis.error + " **The player is not playing**");
            return;
        }

        if (player.queue.items[0].type === QueueableAudioMediaType.TRACK) {
            const track = player.queue.items[0] as Track;

            const color = getAudioMediaSourceEmbedColor(track.source);
            const iconURL = getAudioMediaSourceIconURL(track.source);

            const embed = new EmbedBuilder()
                .setColor(color)
                .setAuthor({
                    name: "Now Playing",
                    iconURL: iconURL
                })
                .setImage(track.imageURL)
                .setDescription(createTrackString(track, false, true))
                .setTimestamp();

            interaction.reply({ embeds: [embed] });
        }
    }
} as Command;