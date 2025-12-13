import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, ColorResolvable, Colors, EmbedBuilder, MessageFlags, PermissionsBitField, StringSelectMenuBuilder } from "discord.js";

import { emojis } from "../../config.json";
import Track from "../structures/models/Track";
import { createProgressBar, formatTimestamp, getAudioMediaSourceIconURL, getAudioMediaSourceEmbedColor } from "./util";
import Album from "../structures/models/Album";
import Playlist from "../structures/models/Playlist";
import { AudioMedia, QueueableAudioMedia } from "../structures/AudioMedia";
import { AudioMediaSource, AudioMediaType, DEFAULT_SEARCH_COUNT, QueueableAudioMediaType, RepeatMode } from "./constants";
import Player from "../structures/player/Player";
import Queue from "../structures/queue/Queue";
import Bot from "../structures/Bot";
import { AudioPlayerPlayingState } from "@discordjs/voice";
import LiveStream from "../structures/models/LiveStream";

export function createAlbumString(album: Album, hasTrackTotal: boolean, hasDuration: boolean, hasRequester: boolean): string {
    let totalDuration = 0;
    album.tracks.forEach((x) => totalDuration += x.duration);

    let title = `**[${album.title}](${album.url})**`;
    let type = "`Album`";
    let artists = album.artists.map((x) => x.name).join(", ");
    let trackTotal = "`" + album.tracks.length.toString() + "` tracks";
    let duration = formatTimestamp(totalDuration);
    let requester = album.requester ? `[<@${album.requester.id}>]` : "";

    return title + "\n" + type + " " + artists + (hasTrackTotal ? " **|** " + trackTotal : "") + (hasDuration ? " **|** `" + duration + "`" : "") + (hasRequester ? " " + requester : "");
}

export function createLiveStreamString(liveStream: LiveStream, hasRequester: boolean): string {
    let title = `**[${liveStream.title}](${liveStream.url})**`
    let type = "`LIVE STREAM`";
    let artists = liveStream.artists.map((x) => x.name).join(", ");
    let requester = liveStream.requester ? `[<@${liveStream.requester.id}>]` : "";

    return title + "\n" + type + " " + artists + (hasRequester ? " " + requester : "");
}

export function createPlaylistString(playlist: Playlist, hasTrackTotal: boolean, hasDuration: boolean, hasRequester: boolean): string {
    let totalDuration = 0;
    playlist.tracks.forEach((x) => totalDuration += x.duration);

    let title = `**[${playlist.title}](${playlist.url})**`;
    let type = "`Playlist`";
    let artists = playlist.owner.name;
    let trackTotal = "`" + playlist.tracks.length.toString() + "` tracks";
    let duration = formatTimestamp(totalDuration);
    let requester = playlist.requester ? `[<@${playlist.requester?.id}>]` : "";

    return title + "\n" + type + " " + artists + (hasTrackTotal ? " **|** " + trackTotal : "") + (hasDuration ? " **|** `" + duration + "`" : "") + (hasRequester ? " " + requester : "");
}

export function createTrackString(track: Track, hasDuration: boolean, hasRequester: boolean): string {
    let title = `**[${track.title}](${track.url})**`
    let artists = track.artists.map((x) => x.name).join(", ");
    let album = track.album ? `[${track.album?.title}](${track.album?.url})` : "";
    let duration = formatTimestamp(track.duration);
    let requester = track.requester ? `[<@${track.requester?.id}>]` : "";

    return title + "\n" + artists + (album ? " **|** " + album : "") + (hasDuration ? " **|** `" + duration + "`" : "") + (hasRequester ? " " + requester : "");
}

export function createSearchResultEmbed(items: AudioMedia[], source: AudioMediaSource): EmbedBuilder {
    const color = getAudioMediaSourceEmbedColor(source);
    const iconURL = getAudioMediaSourceIconURL(source);

    const strings = [];

    for (let i = 0; i < items.length; i++) {
        if (items[i].type === AudioMediaType.ALBUM) {
            const album = items[i] as Album;

            strings.push("`" + (i + 1) + ".` " + createAlbumString(album, false, false, false));
        }
        else if (items[i].type === AudioMediaType.PLAYLIST) {
            const playlist = items[i] as Playlist;

            strings.push("`" + (i + 1) + ".` " + createPlaylistString(playlist, false, false, false));
        }
        else if (items[i].type === AudioMediaType.TRACK) {
            const track = items[i] as Track;

            strings.push("`" + (i + 1) + ".` " + createTrackString(track, true, false));
        }
    }

    return new EmbedBuilder()
        .setColor(color)
        .setAuthor({
            name: "Search Results",
            iconURL: iconURL
        })
        .setDescription(strings.join("\n\n"))
        .setTimestamp();
}

export function createSearchResultStringSelectMenu(items: AudioMedia[], id: string): StringSelectMenuBuilder {
    return new StringSelectMenuBuilder()
        .setCustomId("search-result-select-string-menu" + ".id" + id)
        .setPlaceholder("Select a Result")
        .addOptions(
            items.map((x, i) => {
                if (items[i].type === AudioMediaType.ALBUM) {
                    const album = items[i] as Album;

                    return {
                        label: album.title,
                        description: album.artists.map((x) => x.name).join(", "),
                        value: i.toString()
                    }
                }
                else if (items[i].type === AudioMediaType.PLAYLIST) {
                    const playlist = items[i] as Playlist;

                    return {
                        label: playlist.title,
                        description: playlist.owner.name,
                        value: i.toString()
                    }
                }
                else if (items[i].type === AudioMediaType.TRACK) {
                    const track = items[i] as Track;

                    return {
                        label: track.title,
                        description: track.artists.map((x) => x.name).join(", "),
                        value: i.toString()
                    }
                }
                else {
                    return {
                        label: "undefined",
                        description: "undefined",
                        value: i.toString()
                    }
                }
            })
        )
        .setMinValues(1)
        .setMaxValues(1);
}

export function createAlbumQueuedEmbed(album: Album): EmbedBuilder {
    const color = getAudioMediaSourceEmbedColor(album.source);
    const iconURL = getAudioMediaSourceIconURL(album.source);

    return new EmbedBuilder()
        .setColor(color)
        .setAuthor({
            name: "Queued",
            iconURL: iconURL
        })
        .setThumbnail(album.coverArtURL)
        .setDescription(createAlbumString(album, true, true, true))
        .setTimestamp();
}

export function createLiveStreamQueuedEmbed(liveStream: LiveStream): EmbedBuilder {
    const color = getAudioMediaSourceEmbedColor(liveStream.source);
    const iconURL = getAudioMediaSourceIconURL(liveStream.source);

    return new EmbedBuilder()
        .setColor(color)
        .setAuthor({
            name: "Queued",
            iconURL: iconURL
        })
        .setThumbnail(liveStream.imageURL)
        .setDescription(createLiveStreamString(liveStream, true))
        .setTimestamp();
}

export function createPlaylistQueuedEmbed(playlist: Playlist): EmbedBuilder {
    const color = getAudioMediaSourceEmbedColor(playlist.source);
    const iconURL = getAudioMediaSourceIconURL(playlist.source);

    return new EmbedBuilder()
        .setColor(color)
        .setAuthor({
            name: "Queued",
            iconURL: iconURL
        })
        .setThumbnail(playlist.imageURL)
        .setDescription(createPlaylistString(playlist, true, true, true))
        .setTimestamp();
}

export function createTrackQueuedEmbed(track: Track): EmbedBuilder {
    const color = getAudioMediaSourceEmbedColor(track.source);
    const iconURL = getAudioMediaSourceIconURL(track.source);

    return new EmbedBuilder()
        .setColor(color)
        .setAuthor({
            name: "Queued",
            iconURL: iconURL
        })
        .setThumbnail(track.imageURL)
        .setDescription(createTrackString(track, true, true))
        .setTimestamp();
}

export function createPlayerEmbed(player: Player): EmbedBuilder {
    if (player.queue.isEmpty()) {
        return new EmbedBuilder()
            .setColor(Colors.Default)
            .setAuthor({
                name: "Not Playing",
                iconURL: player.playerManager.bot.user.avatarURL() ?? undefined
            })
            .setTimestamp();
    }
    else {
        const currentlyPlayingItem = player.queue.get(0);

        const color = getAudioMediaSourceEmbedColor(currentlyPlayingItem.source);
        const iconURL = getAudioMediaSourceIconURL(currentlyPlayingItem.source);

        const playerStatus = player.isPlaying() ? player.isPaused() ? "Paused" : "Playing" : "Played";

        const embedBuilder = new EmbedBuilder()
            .setColor(color)
            .setAuthor({
                name: playerStatus,
                iconURL: iconURL
            })
            .setTimestamp();

        if (currentlyPlayingItem.type === QueueableAudioMediaType.LIVE_STREAM) {
            const liveStream = currentlyPlayingItem as LiveStream;

            embedBuilder.setThumbnail(liveStream.imageURL);
            embedBuilder.setDescription(createLiveStreamString(liveStream, true));

            if (player.isPlaying()) {
                const playbackDuration = player.playbackDuration()!;

                embedBuilder.addFields(
                    {
                        name: createProgressBar(playbackDuration, playbackDuration, false),
                        value: "`" + formatTimestamp(playbackDuration) + "` **/** `LIVE`",
                    }
                )
            }
        }
        else if (currentlyPlayingItem.type === QueueableAudioMediaType.TRACK) {
            const track = currentlyPlayingItem as Track;

            embedBuilder.setThumbnail(track.imageURL);
            embedBuilder.setDescription(createTrackString(track, true, true));

            if (player.isPlaying()) {
                const playbackDuration = player.playbackDuration()!;

                embedBuilder.addFields(
                    {
                        name: createProgressBar(playbackDuration, track.duration, false),
                        value: "`" + formatTimestamp(playbackDuration) + "` **/** `" + formatTimestamp(track.duration) + "`",
                    }
                )
            }
        }

        return embedBuilder;
    }
}

export function createPlayerActionRows(player: Player): ActionRowBuilder<ButtonBuilder>[] {
    const actionRowBuilders: ActionRowBuilder<ButtonBuilder>[] = [];

    const disable = !player.isPlaying();

    const actionRowBuilder1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("player-shuffle")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(emojis.shuffle)
                .setDisabled(disable),
            new ButtonBuilder()
                .setCustomId("player-previous")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(emojis.previous)
                .setDisabled(disable),
            new ButtonBuilder()
                .setCustomId("player-pause-resume")
                .setStyle(player.isPaused() ? ButtonStyle.Danger : ButtonStyle.Secondary)
                .setEmoji(player.isPaused() ? emojis.resume : emojis.pause)
                .setDisabled(disable),
            new ButtonBuilder()
                .setCustomId("player-next")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(emojis.next)
                .setDisabled(disable),
            new ButtonBuilder()
                .setCustomId("player-repeat")
                .setStyle(player.queue.repeatMode === RepeatMode.ONE || player.queue.repeatMode === RepeatMode.ALL ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setEmoji(player.queue.repeatMode === RepeatMode.ONE ? emojis.repeat_one : emojis.repeat)
                .setDisabled(disable)
        );

    actionRowBuilders.push(actionRowBuilder1);

    const actionRowBuilder2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("player-now-playing")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(emojis.player_now_playing)
                .setDisabled(disable),
            new ButtonBuilder()
                .setCustomId("player-queue")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(emojis.player_queue)
                .setDisabled(disable),
            new ButtonBuilder()
                .setCustomId("player-volume-down")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(emojis.player_volume_down)
                .setDisabled(player.volume === 0 ? true : disable),
            new ButtonBuilder()
                .setCustomId("player-volume-up")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(emojis.player_volume_up)
                .setDisabled(player.volume === 200 ? true : disable),
            new ButtonBuilder()
                .setCustomId("block")
                .setStyle(ButtonStyle.Secondary)
                .setLabel("\u200B")
                .setDisabled(true)
        );

    actionRowBuilders.push(actionRowBuilder2);

    return actionRowBuilders;
}

export function createTrackConvertingEmbed(track: Track): EmbedBuilder {
    const color = getAudioMediaSourceEmbedColor(track.source);
    const iconURL = getAudioMediaSourceIconURL(track.source);

    return new EmbedBuilder()
        .setColor(color)
        .setAuthor({
            name: "Converting",
            iconURL: iconURL
        })
        .setDescription(createTrackString(track, true, true))
        .setThumbnail(track.imageURL)
        .setTimestamp();
}

export async function createQueueEmptyMessage(bot: Bot): Promise<string> {
    const searchCommandId = await bot.getApplicationCommand("search");
    const searchCommandLink = `</search:${searchCommandId?.id}>`;

    return `**The Queue is empty.** Use ${searchCommandLink} to get this party started! ${emojis.queue_empty}`;
}

export function createQueueEmbed(items: QueueableAudioMedia[]): EmbedBuilder {
    const strings = [];

    for (let i = 0; i < items.length; i++) {
        if (items[i].type === QueueableAudioMediaType.TRACK) {
            const track = items[i] as Track;

            if (i === 0) {
                strings.push(createTrackString(track, true, true));
            }
            else {
                strings.push("`" + (i) + ".` " + createTrackString(track, true, true) + "\n\n");
            }
        }
        else if (items[i].type === QueueableAudioMediaType.LIVE_STREAM) {
            const liveStream = items[i] as LiveStream;

            if (i === 0) {
                strings.push(createLiveStreamString(liveStream, true));
            }
            else {
                strings.push("`" + (i) + ".` " + createLiveStreamString(liveStream, true) + "\n\n");
            }
        }
    }

    const nowPlayingString = strings[0];
    strings.shift();

    let upNextString = strings.join("");

    if (upNextString === "") {
        upNextString = "Nothing";
    }

    return new EmbedBuilder()
        .setColor(Colors.Default)
        .setAuthor({
            name: "Queue",
            iconURL: undefined
        })
        .setDescription("__**Now Playing**__\n" + nowPlayingString + "\n\n__**Up Next**__\n" + upNextString)
        .setFields(
            {
                name: "Items",
                value: "`" + items.length.toString() + "`",
                inline: true
            }
        );
}

