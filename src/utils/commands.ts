import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, PermissionsBitField } from "discord.js";

import Bot from "../structures/Bot";
import { emojis } from "../../config.json";
import { getAudioMediaSourceEmbedColor, getAudioMediaSourceIconURL } from "./util";
import { QueueableAudioMediaType, RepeatMode } from "./constants";
import Track from "../structures/models/Track";
import { createQueueEmbed, createQueueEmptyMessage, createTrackString } from "./components";

export async function nextCommand(bot: Bot, interaction: ChatInputCommandInteraction<"cached"> | ButtonInteraction<"cached">, options?: { force: boolean }): Promise<void> {
    let force = false;

    if (options) {
        if (options.force) force = options.force;
    }

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

    if (player.queue.isEmpty()) {
        await interaction.reply(await createQueueEmptyMessage(bot));
        return;
    }

    const voiceChannel = await player.voiceChannel.fetch();
    const voiceChannelMemberCount = voiceChannel.members.filter(x => !x.user.bot).size;

    if (voiceChannelMemberCount > 2 && !force) {
        const requiredVotes = Math.trunc(voiceChannelMemberCount * 0.75);

        if (player.queue.nextVoteList.find(x => x.id === interaction.user.id)) {
            await interaction.reply({ content: emojis.error + " **You already voted to skip to the next item** (" + player.queue.nextVoteList.length + "/" + requiredVotes + " people).", flags: MessageFlags.Ephemeral });
            return;
        }
        else player.queue.nextVoteList.push(interaction.user);

        if (player.queue.nextVoteList.length >= requiredVotes) {
            player.skipToNext();
            await interaction.reply(emojis.next + " **Next**");
            return;
        }
        else {
            const actionRowBuilder = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("next-vote")
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji(emojis.vote)
                );

            interaction.reply({ content: "**Skip to the next item?** (" + player.queue.nextVoteList.length + "/" + requiredVotes + " people).", components: [actionRowBuilder] });
        }
    }
    else {
        player.skipToNext();
        await interaction.reply(emojis.next + " **Next**");
    }
}

export async function previousCommand(bot: Bot, interaction: ChatInputCommandInteraction<"cached"> | ButtonInteraction<"cached">, options?: { force: boolean }) {
    let force = false;

    if (options) {
        if (options.force) force = options.force;
    }

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

    if (player.queue.isEmpty()) {
        await interaction.reply(await createQueueEmptyMessage(bot));
        return;
    }

    const voiceChannel = await player.voiceChannel.fetch();
    const voiceChannelMemberCount = voiceChannel.members.filter(x => !x.user.bot).size;

    if (voiceChannelMemberCount > 2 && !force) {
        const requiredVotes = Math.trunc(voiceChannelMemberCount * 0.75);

        if (player.queue.previousVoteList.find(x => x.id === interaction.user.id)) {
            await interaction.reply({ content: emojis.error + " **You already voted to skip to the previous item** (" + player.queue.previousVoteList.length + "/" + requiredVotes + " people).", flags: MessageFlags.Ephemeral });
            return;
        }
        else player.queue.previousVoteList.push(interaction.user);

        if (player.queue.previousVoteList.length >= requiredVotes) {
            player.skipToPrevious();
            await interaction.reply(emojis.previous + " **Previous**");
        }
        else {
            const actionRowBuilder = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("previous-vote")
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji(emojis.vote)
                );

            await interaction.reply({ content: "**Skip to the previous item?** (" + player.queue.previousVoteList.length + "/" + requiredVotes + " people).", components: [actionRowBuilder] });
        }
    }
    else {
        player.skipToPrevious();
        await interaction.reply(emojis.previous + " **Previous**");
    }
}

export async function nowPlayingCommand(bot: Bot, interaction: ChatInputCommandInteraction<"cached"> | ButtonInteraction<"cached">) {
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

export async function pauseCommand(bot: Bot, interaction: ChatInputCommandInteraction<"cached"> | ButtonInteraction<"cached">) {
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

    if (player.isPaused()) {
        await interaction.reply(emojis.error + " **The player is already paused.**");
        return;
    }

    player.pause();
    await interaction.reply(emojis.pause + " **Paused**");
}

export async function resumeCommand(bot: Bot, interaction: ChatInputCommandInteraction<"cached"> | ButtonInteraction<"cached">) {
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

    if (!player.isPaused()) {
        await interaction.reply(emojis.error + " **The player is not paused.**");
        return;
    }

    player.resume();
    await interaction.reply(emojis.resume + " **Resumed**");
}

export async function queueCommand(bot: Bot, interaction: ChatInputCommandInteraction<"cached"> | ButtonInteraction<"cached">) {
    const player = bot.playerManager.getPlayer(interaction.guild.id);

    if (!player || !player.voiceChannel) {
        await interaction.reply(emojis.error + " **I am not connected to a voice channel.**");
        return;
    }

    if (player.queue.isEmpty()) {
        await interaction.reply(await createQueueEmptyMessage(bot));
        return;
    }

    await interaction.reply({ embeds: [createQueueEmbed(player.queue.items)] });
}

export async function repeatCommand(bot: Bot, interaction: ChatInputCommandInteraction<"cached"> | ButtonInteraction<"cached">, options?: { mode: RepeatMode }) {
    let mode: RepeatMode = RepeatMode.OFF;

    if (options) {
        if (options.mode) mode = options.mode;
    }

    const player = bot.playerManager.getPlayer(interaction.guild.id);

    if (!interaction.member.voice.channel) {
        await interaction.reply(emojis.error + " **You have to be in a voice channel to use this command**");
        return;
    }

    if (!player || !player.voiceChannel) {
        await interaction.reply(emojis.error + " **I am not connected to a voice channel.**");
        return;
    }

    if (interaction.member.voice.channel.id !== player.voiceChannel.id) {
        await interaction.reply(emojis.error + " **You need to be in the same voice channel as Bass to use this command**");
        return;
    }

    if (mode === RepeatMode.ONE) {
        player.queue.repeatMode = RepeatMode.ONE;
        await interaction.reply(emojis.repeat_one + " **One**");
    }
    else if (mode === RepeatMode.ALL) {
        player.queue.repeatMode = RepeatMode.ALL;
        await interaction.reply(emojis.repeat + " **All**");
    }
    else {
        player.queue.repeatMode = RepeatMode.OFF;
        await interaction.reply(emojis.repeat + " **Off**");
    }
}

export async function shuffleCommand(bot: Bot, interaction: ChatInputCommandInteraction<"cached"> | ButtonInteraction<"cached">) {
    const player = bot.playerManager.getPlayer(interaction.guild.id);

    if (!interaction.member.voice.channel) {
        await interaction.reply(emojis.error + " **You have to be in a voice channel to use this command**");
        return;
    }

    if (!player || !player.voiceChannel) {
        await interaction.reply(emojis.error + " **I am not connected to a voice channel.**");
        return;
    }

    if (interaction.member.voice.channel.id !== player.voiceChannel.id) {
        await interaction.reply(emojis.error + " **You need to be in the same voice channel as Bass to use this command**");
        return;
    }

    if (!player.isPlaying()) {
        await interaction.reply(emojis.error + " **The player is not playing**");
        return;
    }

    player.queue.shuffle();
    await interaction.reply(emojis.shuffle + " **Shuffled**");
}

export async function volumeCommand(bot: Bot, interaction: ChatInputCommandInteraction<"cached"> | ButtonInteraction<"cached">, options?: { level: number }) {
    let level = 100;

    if (options) {
        if (options.level) level = options.level;
    }

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

    let volumeEmoji;
    if (level === 0) volumeEmoji = emojis.volume_muted;
    else if (level < 25) volumeEmoji = emojis.volume_low;
    else if (level < 75) volumeEmoji = emojis.volume_medium;
    else volumeEmoji = emojis.volume_high;

    player.setVolume(level);
    await interaction.reply(volumeEmoji + " **Volume level is now set to " + player.volume + "%**");
}