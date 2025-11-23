import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ColorResolvable, Colors, EmbedBuilder, StringSelectMenuBuilder } from "discord.js";

import { emojis } from "../../config.json";
import Track from "../structures/models/Track";
import { createProgressBar, formatDurationTimestamp, getAudioMediaSourceIconURL, getAudioMediaSourceEmbedColor } from "./util";
import Album from "../structures/models/Album";
import Playlist from "../structures/models/Playlist";
import { AudioMedia, QueueableAudioMedia } from "../structures/AudioMedia";
import { AudioMediaSource, AudioMediaType, DEFAULT_SEARCH_COUNT, QueueableAudioMediaType } from "./constants";
import Player from "../structures/player/Player";
import Queue from "../structures/queue/Queue";
import Bot from "../structures/Bot";
import { AudioPlayerPlayingState } from "@discordjs/voice";

export function createAlbumString(album: Album, hasDurationStr: boolean, hasRequesterStr: boolean): string {
    let totalDuration = 0;
    album.tracks.forEach((x) => totalDuration += x.duration);

    let titleStr = `**[${album.title}](${album.url})**`;
    let typeStr = "`Album`";
    let artistsStr = album.artists.map((x) => x.name).join(", ");
    let totalTracksStr = "`" + album.tracks.length.toString() + "`";
    let durationStr = hasDurationStr ? formatDurationTimestamp(totalDuration) : null;
    let requesterStr = hasRequesterStr ? album.requester ? `[<@${album.requester?.id}>]` : null : null;

    return typeStr + " " + titleStr + "\n" + artistsStr + " **|** " + totalTracksStr + (durationStr ? " **|** `" + durationStr + "`" : "") + (requesterStr ? " " + requesterStr : "");
}

export function createPlaylistString(playlist: Playlist, hasDurationStr: boolean, hasRequesterStr: boolean): string {
    let totalDuration = 0;
    playlist.tracks.forEach((x) => totalDuration += x.duration);

    let titleStr = `**[${playlist.title}](${playlist.url})**`;
    let typeStr = "`Playlist`";
    let artistsStr = playlist.owner.name;
    let totalTracksStr = "`" + playlist.tracks.length.toString() + "`";
    let durationStr = hasDurationStr ? formatDurationTimestamp(totalDuration) : null;
    let requesterStr = hasRequesterStr ? playlist.requester ? `[<@${playlist.requester?.id}>]` : null : null;

    return typeStr + " " + titleStr + "\n" + artistsStr + " **|** " + totalTracksStr + (durationStr ? " **|** `" + durationStr + "`" : "") + (requesterStr ? " " + requesterStr : "");
}

export function createTrackString(track: Track, hasDurationStr: boolean, hasRequesterStr: boolean): string {
    let titleStr = (track.isLiveStream ? "" : "") + " " + `**[${track.title}](${track.url})**`
    let artistsStr = track.artists.map((x) => x.name).join(", ");
    let albumStr = track.album ? `[${track.album?.title}](${track.album?.url})` : null;
    let durationStr = hasDurationStr ? !track.isLiveStream ? formatDurationTimestamp(track.duration) : null : null;
    let requesterStr = hasRequesterStr ? track.requester ? `[<@${track.requester?.id}>]` : null : null;

    return titleStr + "\n" + artistsStr + (albumStr ? "**|** " + albumStr : "") + (durationStr ? " **|** `" + durationStr + "`" : "") + (requesterStr ? " " + requesterStr : "");
}

export function createSearchResultEmbed(items: AudioMedia[], source: AudioMediaSource): EmbedBuilder {
    const color = getAudioMediaSourceEmbedColor(source);
    const iconURL = getAudioMediaSourceIconURL(source);

    const strings = [];

    for (let i = 0; i < items.length; i++) {
        if (items[i].type === AudioMediaType.ALBUM) {
            const album = items[i] as Album;

            strings.push("`" + (i + 1) + ".` " + createAlbumString(album, true, false));
        }
        else if (items[i].type === AudioMediaType.PLAYLIST) {
            const playlist = items[i] as Playlist;

            strings.push("`" + (i + 1) + ".` " + createPlaylistString(playlist, true, false));
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
        .setDescription(createAlbumString(album, true, true))
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
        .setDescription(createPlaylistString(playlist, true, true))
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
    let embedBuilder = null;

    if (player.queue.isEmpty()) {
        embedBuilder = new EmbedBuilder()
            .setColor(Colors.Default)
            .setAuthor({
                name: "Not Playing",
                iconURL: player.playerManager.bot.user.avatarURL() ?? undefined
            })
            .setTimestamp();
    }
    else {
        const item = player.queue.get(0);
        const color = getAudioMediaSourceEmbedColor(item.source);
        const iconURL = getAudioMediaSourceIconURL(item.source);
        const audioPlayerState = player.audioPlayer!.state as AudioPlayerPlayingState;
        const playbackDuration = audioPlayerState.playbackDuration + player.metadata.addedPlaybackDuration;
        const status = player.isPlaying() ? player.isPaused() ? "Paused" : "Playing" : "Played";

        if (item.type === QueueableAudioMediaType.TRACK) {
            const track = item as Track;

            embedBuilder = new EmbedBuilder()
                .setColor(color)
                .setAuthor({
                    name: status,
                    iconURL: iconURL
                })
                .setThumbnail(track.imageURL)
                .setDescription(createTrackString(track, false, true))
                .setTimestamp();

            if (player.isPlaying()) {
                embedBuilder.addFields(
                    {
                        name: createProgressBar(playbackDuration, track.duration, false),
                        value: "`" + formatDurationTimestamp(playbackDuration) + "` **/** `" + formatDurationTimestamp(track.duration) + "`",
                    }
                )
            }
        }
    }

    return embedBuilder!;
}

export function createPlayerActionRows(player: Player): ActionRowBuilder<ButtonBuilder>[] {
    const actionRowBuilders: ActionRowBuilder<ButtonBuilder>[] = [];

    const disable = !player.isPlaying();

    const actionRowBuilder1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("player_shuffle")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(emojis.shuffle)
                .setDisabled(disable),
            new ButtonBuilder()
                .setCustomId("player_previous")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(emojis.previous)
                .setDisabled(disable),
            new ButtonBuilder()
                .setCustomId("player_pause_resume")
                .setStyle(ButtonStyle.Success)
                .setEmoji(player.isPaused() ? emojis.resume : emojis.pause)
                .setDisabled(disable),
            new ButtonBuilder()
                .setCustomId("player_next")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(emojis.next)
                .setDisabled(disable),
            new ButtonBuilder()
                .setCustomId("player_repeat")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(emojis.repeat)
                .setDisabled(disable)
        );

    actionRowBuilders.push(actionRowBuilder1);

    const actionRowBuilder2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("player_now_playing")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(emojis.player_now_playing)
                .setDisabled(disable),
            new ButtonBuilder()
                .setCustomId("player_queue")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(emojis.player_queue)
                .setDisabled(disable),
            new ButtonBuilder()
                .setCustomId("player_volume_down")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(emojis.player_volume_down)
                .setDisabled(disable),
            new ButtonBuilder()
                .setCustomId("player_volume_up")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji(emojis.player_volume_up)
                .setDisabled(disable),
            new ButtonBuilder()
                .setCustomId("block")
                .setStyle(ButtonStyle.Secondary)
                .setLabel("\u200B")
                .setDisabled(disable)
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