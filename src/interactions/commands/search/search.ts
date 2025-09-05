import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ColorResolvable, Colors, ComponentType, EmbedBuilder, MessageFlags, PermissionsBitField, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction } from "discord.js";

import Command from "../../../structures/Command";
import { emojis } from "../../../../config.json";
import { resolveURLType, search, searchURL } from "../../../structures/search/search";
import { AudioMediaSource, AudioMediaType, DEFAULT_SEARCH_COUNT, DEFAULT_SEARCH_RESULT_TIMEOUT, QueueableAudioMediaType, SearchResultType, SOUNDCLOUD_ICON_URL, SPOTIFY_ICON_URL, YOUTUBE_ICON_URL, YOUTUBE_MUSIC_ICON_URL } from "../../../utils/constants";
import Track from "../../../structures/models/Track";
import { formatDurationTimestamp } from "../../../utils/util";
import Album from "../../../structures/models/Album";
import Playlist from "../../../structures/models/Playlist";
import { createSearchResultEmbed, createTrackQueuedEmbed, createPlaylistQueuedEmbed, createAlbumQueuedEmbed, createSearchResultStringSelectMenu } from "../../../utils/messages";
import { it } from "node:test";
import { AudioMedia } from "../../../structures/AudioMedia";

const sourceChoices = [
    {
        name: "YouTube",
        value: AudioMediaSource.YOUTUBE
    },
    {
        name: "SoundCloud",
        value: AudioMediaSource.SOUNDCLOUD
    }
];

export default {
    name: "search",
    category: "Player",
    data: new SlashCommandBuilder()
        .setName("search")
        .setDescription("Searches for an item, adds it to the queue.")
        .addStringOption(option =>
            option.setName("query")
                .setDescription("Enter a query or link.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("source")
                .setDescription("Enter a source to search from.")
                .addChoices(sourceChoices)
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option.setName("play-now")
                .setDescription("Whether to play the item now.")
                .setRequired(false)
        ),
    async execute(bot, interaction) {
        const textChannel = interaction.channel;
        const voiceChannel = interaction.member.voice.channel;

        if (!textChannel || !interaction.guild.members.me) throw new ReferenceError();

        const botPermissionsFor = textChannel.permissionsFor(interaction.guild.members.me);
        if (!botPermissionsFor.has(PermissionsBitField.Flags.EmbedLinks)) return interaction.reply(emojis.permission_error + " **I do not have permission to Use Embed Links in** <#" + textChannel.id + ">");

        const player = bot.playerManager.getPlayer(interaction.guild.id);

        if (!player || !player.isConnected()) {
            await interaction.reply({ content: emojis.error + " **I am not connected to a voice channel.**", flags: MessageFlags.Ephemeral });
            return;
        }

        if (!voiceChannel) {
            await interaction.reply(emojis.error + " **You have to be in a voice channel to use this command.**");
            return;
        }

        if (player.voiceChannel?.id !== voiceChannel.id) {
            await interaction.reply(emojis.error + " **You need to be in the same voice channel as Bass to use this command.**");
            return;
        }

        let query = interaction.options.getString("query");
        let source = interaction.options.getString("source") as AudioMediaSource;

        if (!query) {
            await interaction.reply({ content: "An error occured while executing this command", ephemeral: true });
            return;
        }



        await interaction.reply({ content: emojis.searching + " **Searching...** `" + query + "`", ephemeral: true });

        let searchResult = null;

        if (source) {
            searchResult = await search(query, source, { requester: interaction.user });
        }
        else {
            searchResult = await searchURL(query, { requester: interaction.user });

            // Default to YouTube search
            if (searchResult.type === SearchResultType.NOT_FOUND) {
                searchResult = await search(query, AudioMediaSource.YOUTUBE, { requester: interaction.user, type: "TRACK" });
            }
        }

        if (searchResult.type === SearchResultType.FOUND) {
            let embed;

            if (searchResult.items[0].type === AudioMediaType.ALBUM) {
                const album = searchResult.items[0] as Album;

                album.tracks.forEach((x) => player.queue.add(x));

                embed = createAlbumQueuedEmbed(album);
            }
            else if (searchResult.items[0].type === AudioMediaType.PLAYLIST) {
                const playlist = searchResult.items[0] as Playlist;

                playlist.tracks.forEach((x) => player.queue.add(x));

                embed = createPlaylistQueuedEmbed(playlist);
            }
            else if (searchResult.items[0].type === AudioMediaType.TRACK) {
                const track = searchResult.items[0] as Track;

                player.queue.add(track);

                embed = createTrackQueuedEmbed(track);
            }

            await interaction.deleteReply();
            await interaction.channel.send({ embeds: [embed!] });

            if (!player.isPlaying()) await player.play();
        }
        else if (searchResult.type === SearchResultType.RESULTS) {
            // Prevents duplicate operation on components from collector
            const id = Date.now().toString();

            const embedBuilders: EmbedBuilder[] = [];
            const actionRowBuilders: ActionRowBuilder<StringSelectMenuBuilder>[] = [];

            let currentItems = 0;

            // Create new page every 5 items
            for (let i = 0; i < searchResult.items.length; i += 5) {
                const items = searchResult.items.slice(i, i + 5);

                const embed = createSearchResultEmbed(items, searchResult.source!);
                const selectStringMenu = createSearchResultStringSelectMenu(items, id);

                const actionRow1 = new ActionRowBuilder<StringSelectMenuBuilder>()
                    .addComponents(
                        [
                            selectStringMenu
                        ]
                    );

                embedBuilders.push(embed);
                actionRowBuilders.push(actionRow1);
            }

            const actionRow2 = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("search-result-previous-button" + ".id" + id)
                        .setEmoji("⬅️")
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId("search-result-clear-button" + ".id" + id)
                        .setEmoji("❌")
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId("search-result-next-button" + ".id" + id)
                        .setEmoji("➡️")
                        .setStyle(ButtonStyle.Primary)
                );

            actionRow2.components[0].setDisabled(true);
            if (embedBuilders.length <= 1) actionRow2.components[2].setDisabled(true); 

            const message = await interaction.editReply({ content: null, embeds: [embedBuilders[currentItems]], components: [actionRowBuilders[currentItems], actionRow2] });

            const messageComponentCollector = message.createMessageComponentCollector(
                {
                    filter: (x) => x.customId.includes(id) && x.user.id === interaction.user.id,
                    time: DEFAULT_SEARCH_RESULT_TIMEOUT,
                }
            );

            messageComponentCollector.on("collect", async (x) => {
                if (x.isStringSelectMenu() && x.customId.startsWith("search-result-select-string-menu")) {
                    messageComponentCollector.stop()

                    let embed;

                    if (searchResult.items[Number(x.values[0])].type === AudioMediaType.ALBUM) {
                        const album = searchResult.items[Number(x.values[0])] as Album;

                        album.tracks.forEach((x) => player.queue.add(x));

                        embed = createAlbumQueuedEmbed(album);
                    }
                    else if (searchResult.items[Number(x.values[0])].type === AudioMediaType.PLAYLIST) {
                        const playlist = searchResult.items[Number(x.values[0])] as Playlist;

                        playlist.tracks.forEach((x) => player.queue.add(x));

                        embed = createPlaylistQueuedEmbed(playlist);
                    }
                    else if (searchResult.items[Number(x.values[0])].type === AudioMediaType.TRACK) {
                        const track = searchResult.items[Number(x.values[0])] as Track;

                        player.queue.add(track);

                        embed = createTrackQueuedEmbed(track);
                    }

                    await interaction.deleteReply();
                    await x.channel?.send({ embeds: [embed!] });

                    if (!player.isPlaying()) await player.play();
                }
                else if (x.isButton()) {
                    if (x.customId.startsWith("search-result-previous-button")) {
                        currentItems--;

                        if (currentItems <= 0) actionRow2.components[0].setDisabled(true);
                        actionRow2.components[2].setDisabled(false);

                        await x.update({ embeds: [embedBuilders[currentItems]], components: [actionRow2]});
                    }
                    else if (x.customId.startsWith("search-result-clear-button")) {
                        messageComponentCollector.stop();

                        await x.update({ content: emojis.pending + " Cleared", embeds: [], components: [] });
                    }
                    else if (x.customId.startsWith("search-result-next-button")) {
                        currentItems++;

                        actionRow2.components[0].setDisabled(false);
                        if (currentItems >= embedBuilders.length - 1) actionRow2.components[2].setDisabled(true);

                        await x.update({ embeds: [embedBuilders[currentItems]], components: [actionRow2]});
                    }
                    else return;
                }
                else return;
            });

            messageComponentCollector.on("end", async (collected, reason) => {
                if (reason === "time") {
                    await interaction.editReply({ content: emojis.error + " Confirmation not received within 1 minute, cancelling", components: [], embeds: [] });
                }
            });
        }
        else if (searchResult.type === SearchResultType.NOT_FOUND) {
            await interaction.editReply(emojis.error + " **Not Found.**");
        }
        else if (searchResult.type === SearchResultType.NO_RESULTS) {
            await interaction.editReply(emojis.error + " **No Results Found.**");
        }
    }
} as Command;