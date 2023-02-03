const { ApplicationCommandOptionType, Client, CommandInteraction, CommandInteractionOptionResolver, PermissionsBitField, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const MusicSubscription = require("../../structures/MusicSubscription");
const { LoadType, QueryType } = require("../../utils/constants");

module.exports = {
    name: "search",
    category: "Music",
    description: "Displays a list of songs that match the query.",
    utilisation: "search <query>",
    options: [
        {
            name: "query",
            description: "Enter a query",
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],

    /**
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     * @param {CommandInteractionOptionResolver} args 
     */
    async execute(client, interaction, args) {
        /**
         * @type {MusicSubscription}
         */
        let subscription = client.subscriptions.get(interaction.guild.id);

        const botPermissionsFor = interaction.channel.permissionsFor(interaction.guild.members.me);
        if (!botPermissionsFor.has(PermissionsBitField.Flags.UseExternalEmojis)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Use External Emojis in** <#" + interaction.channel.id + ">");
        if (!botPermissionsFor.has(PermissionsBitField.Flags.EmbedLinks)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Embed Links in** <#" + interaction.channel.id + ">");


        if (!args[0]) return interaction.reply(client.emotes.error + " **A query is required**");


        if (!interaction.member.voice.channel) return interaction.reply(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (subscription && subscription.connection && interaction.member.voice.channel.id !== subscription.voiceChannel.id) return interaction.reply(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");


        if (!subscription) {
            subscription = new MusicSubscription(client, interaction.guild.id, interaction.channel);
        }

        if (!subscription.connection) {
            const botPermissionsForVoice = interaction.member.voice.channel.permissionsFor(interaction.guild.members.me);
            if (!botPermissionsForVoice.has(PermissionsBitField.Flags.Connect)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Connect in** <#" + interaction.member.voice.channel.id + ">");
            if (!botPermissionsForVoice.has(PermissionsBitField.Flags.Speak)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Speak in** <#" + interaction.member.voice.channel.id + ">");

            interaction.deferReply();
            try {
                await subscription.connect(interaction.member.voice.channel);
            } catch {
                return interaction.editReply(client.emotes.error + " **Error connecting to ** <#" + interaction.member.voice.channel.id + ">");
            }
            interaction.editReply(client.emotes.success + " **Connected to <#" + interaction.member.voice.channel.id + "> and bound to** <#" + interaction.channel.id + ">");
        }

        // Search the link/query and add to the queue
        const query = args.getString("query");
        const queryType = QueryType.YOUTUBE_SEARCH;

        let searchEmoji = client.emotes.youtube;
        if (interaction.deferred) interaction.channel.send(searchEmoji + " **Searching...** " + client.emotes.searching + " `" + query + "`");
        else interaction.reply(searchEmoji + " **Searching...** " + client.emotes.searching + " `" + query + "`");

        const res = await subscription.search(query, interaction.user, { queryType: queryType, searchLimit: 5 });
        if (res.loadType === LoadType.SEARCH_RESULT) {
            const embed = new EmbedBuilder()
                .setColor("Red")
                .setAuthor({
                    name: "Search Results",
                    iconURL: "https://cdn.discordapp.com/emojis/844386374143967253"
                })
                .setDescription(res.tracks.map((track, i) => "`" + (i + 1) + ".` " + `[${track.title}](${track.url})\n` + track.channel + " **|** `" + track.durationFormatted + "`").join("\n\n"));

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
                                        description: track.channel + " | " + track.durationFormatted,
                                        value: (i + 1).toString()
                                    }
                                })
                            )
                            .setMinValues(1)
                            .setMaxValues(1)
                    ]
                )

            const searchMessage = await interaction.channel.send({ embeds: [embed], components: [row] });

            const collector = interaction.channel.createMessageComponentCollector({
                filter: x => x.user.id === interaction.user.id,
                time: 60000,
                errors: ["time"]
            });

            collector.on("collect", async (i) => {
                if (!i.isStringSelectMenu()) return;

                if (i.customId === "search-results" + `.id${uid}`) {
                    collector.stop();
                    searchMessage.delete();

                    subscription.queue.add(res.tracks[i.values[0] - 1]);

                    const embed = new EmbedBuilder()
                        .setColor("DarkGreen")
                        .setAuthor({
                            name: "Queued",
                            iconURL: interaction.user.avatarURL()
                        })
                        .setDescription(`**[${res.tracks[i.values[0] - 1].title}](${res.tracks[i.values[0] - 1].url})**`)
                        .setFields(
                            {
                                name: "Channel",
                                value: res.tracks[i.values[0] - 1].channel,
                                inline: true
                            },
                            {
                                name: "Duration",
                                value: "`" + res.tracks[i.values[0] - 1].durationFormatted + "`",
                                inline: true
                            },
                            {
                                name: "Position in queue",
                                value: `${subscription.queue.length - 1}`,
                                inline: true
                            }
                        );

                    interaction.channel.send({ embeds: [embed] });

                    if (!subscription.isPlaying()) {
                        await subscription.play();
                    }
                } else return;
            });

            collector.on("end", (collected, reason) => {
                const newRow = new ActionRowBuilder(row);
                newRow.components[0].setDisabled();

                if (reason === "time") {
                    searchMessage.edit({ components: [newRow] });
                }
            });
        } else if (res.loadType === LoadType.NO_MATCHES) return interaction.channel.send(client.emotes.error + " **No results found**");
        else if (res.loadType === LoadType.LOAD_FAILED) return interaction.channel.send(client.emotes.error + " **Error searching**");
    }
}