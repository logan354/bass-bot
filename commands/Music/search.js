const { Client, Message, PermissionsBitField, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const MusicSubscription = require("../../structures/MusicSubscription");
const { LoadType, QueryType } = require("../../utils/constants");

module.exports = {
    name: "search",
    aliases: ["se", "find"],
    category: "Music",
    description: "Displays a list of songs that match the query.",
    utilisation: "search <query>",

    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {string[]} args 
     */
    async execute(client, message, args) {
        /**
         * @type {MusicSubscription}
         */
        let subscription = client.subscriptions.get(message.guild.id);

        const botPermissionsFor = message.channel.permissionsFor(message.guild.members.me);
        if (!botPermissionsFor.has(PermissionsBitField.Flags.UseExternalEmojis)) return message.channel.send(client.emotes.permissionError + " **I do not have permission to Use External Emojis in** <#" + message.channel.id + ">");
        if (!botPermissionsFor.has(PermissionsBitField.Flags.EmbedLinks)) return message.channel.send(client.emotes.permissionError + " **I do not have permission to Embed Links in** <#" + message.channel.id + ">");


        if (!args[0]) return message.channel.send(client.emotes.error + " **A query is required**");


        if (!message.member.voice.channel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (subscription && subscription.connection && message.member.voice.channel.id !== subscription.voiceChannel.id) return message.channel.send(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");


        if (!subscription) {
            subscription = new MusicSubscription(client, message.guild.id, message.channel);
        }

        const query = args.join(" ");
        const queryType = QueryType.YOUTUBE_SEARCH;

        let searchEmoji = client.emotes.youtube;
        message.channel.send(searchEmoji + " **Searching...** " + client.emotes.searching + " `" + query + "`");

        const res = await subscription.search(query, message.author, { queryType: queryType, searchLimit: 10 });
        if (res.loadType === LoadType.SEARCH_RESULT) {
            const embed = new EmbedBuilder()
                .setColor("DarkGreen")
                .setAuthor({
                    name: "Search results",
                    iconURL: client.user.avatarURL()
                })
                .setDescription(res.tracks.map((track, i) => "`" + (i + 1) + ".` " + `[${track.title}](${track.url})` + " - `" + track.durationFormatted + "`").join("\n\n"));

            const uid = new Date().getTime();

            const row = new ActionRowBuilder()
                .addComponents(
                    [
                        new StringSelectMenuBuilder()
                            .setCustomId("search-results" + `.id${uid}`)
                            .setPlaceholder("Select a song")
                            .addOptions(
                                res.tracks.map((track, i) => {
                                    return {
                                        label: track.title,
                                        description: track.channel + " - " + track.durationFormatted,
                                        value: (i + 1).toString()
                                    }
                                })
                            )
                            .setMinValues(1)
                            .setMaxValues(1)
                    ]
                )

            const searchMessage = await message.channel.send({ embeds: [embed], components: [row] });

            const collector = message.channel.createMessageComponentCollector({
                time: 60000,
                errors: ["time"],
                filter: x => x.user.id === message.author.id
            });

            collector.on("collect", async (interaction) => {
                if (!interaction.isStringSelectMenu()) return;

                if (interaction.customId === "search-results" + `.id${uid}`) {
                    await interaction.deferUpdate();

                    searchMessage.edit({ content: "\u200B", embeds: [], components: [] });
                    collector.stop();

                    if (!subscription.connection) {
                        const botPermissionsForVoice = message.member.voice.channel.permissionsFor(message.guild.members.me);
                        if (!botPermissionsForVoice.has(PermissionsBitField.Flags.Connect)) return message.channel.send(client.emotes.permissionError + " **I do not have permission to Connect in** <#" + message.member.voice.channel.id + ">");
                        if (!botPermissionsForVoice.has(PermissionsBitField.Flags.Speak)) return message.channel.send(client.emotes.permissionError + " **I do not have permission to Speak in** <#" + message.member.voice.channel.id + ">");

                        try {
                            await subscription.connect(message.member.voice.channel);
                        } catch {
                            return message.channel.send(client.emotes.error + " **Error connecting to ** <#" + message.member.voice.channel.id + ">");
                        }
                        message.channel.send(client.emotes.success + " **Connected to <#" + message.member.voice.channel.id + "> and bound to** <#" + message.channel.id + ">");
                    }

                    subscription.queue.add(res.tracks[interaction.values[0] - 1]);

                    const embed = new EmbedBuilder()
                        .setColor("DarkGreen")
                        .setAuthor({
                            name: "Queued",
                            iconURL: message.author.avatarURL()
                        })
                        .setDescription(`**[${res.tracks[interaction.values[0] - 1].title}](${res.tracks[interaction.values[0] - 1].url})**`)
                        .setFields(
                            {
                                name: "Channel",
                                value: res.tracks[interaction.values[0] - 1].channel,
                                inline: true
                            },
                            {
                                name: "Duration",
                                value: res.tracks[interaction.values[0] - 1].durationFormatted,
                                inline: true
                            },
                            {
                                name: "Position in queue",
                                value: `${subscription.queue.length - 1}`,
                                inline: true
                            }
                        );

                    message.channel.send({ embeds: [embed] });

                    if (!subscription.isPlaying()) {
                        await subscription.play();
                    }
                } else return;
            });

            collector.on("end", (collection, reason) => {
                if (reason === "time") {
                    searchMessage.edit({ content: client.emotes.error + " **Timeout**", embeds: [], components: [] });
                }
            });
        } else if (res.loadType === LoadType.NO_MATCHES) return message.channel.send(client.emotes.error + " **No results found**");
        else if (res.loadType === LoadType.LOAD_FAILED) return message.channel.send(client.emotes.error + " **Error searching**");
    }
}