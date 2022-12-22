const { Client, CommandInteraction, CommandInteractionOptionResolver, Permissions, MessageEmbed, MessageSelectMenu, MessageActionRow } = require("discord.js");
const Queue = require("../../structures/Queue");
const { buildTrack } = require("../../utils/builders");
const { LoadType, State, QueryTypes } = require("../../utils/constants");

module.exports = {
    name: "search",
    category: "Track",
    description: "Shows a list of songs that match the search query",
    options: [
        {
            name: "query",
            description: "Enter a search query",
            required: true,
            type: "STRING"
        }
    ],

    /**
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     * @param {CommandInteractionOptionResolver} args 
     */
    async execute(client, interaction, args) {
        let serverQueue = client.queues.get(interaction.guild.id);
        const voiceChannel = interaction.member.voice.channel;

        const botPermissionsFor = interaction.channel.permissionsFor(interaction.guild.me);
        if (!botPermissionsFor.has(Permissions.FLAGS.USE_EXTERNAL_EMOJIS)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Use External Emojis in** " + "`" + interaction.channel.name + "`");
        if (!botPermissionsFor.has(Permissions.FLAGS.EMBED_LINKS)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Embed Links in** " + "`" + interaction.channel.name + "`");

        if (!voiceChannel) return interaction.reply(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (interaction.guild.me.voice.channel && interaction.member.voice.channel.id !== interaction.guild.me.voice.channel.id) return interaction.reply(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");

        if (!serverQueue) {
            serverQueue = new Queue(client, interaction.guild.id, interaction.channel);
        }

        // Create query and query type
        const query = args.getString("query");

        // Search the users query
        const res = await serverQueue.search(query, interaction.user, { queryType: QueryTypes.YOUTUBE_SEARCH });
        if (res.loadType === LoadType.SEARCH_RESULT) {
            const embed = new MessageEmbed()
                .setColor("BLACK")
                .setAuthor({
                    name: "Search results for " + query,
                    iconURL: client.config.app.logo
                })
                .setDescription(res.tracks.map((track, i) => "`" + (i + 1) + ".` " + `[${track.title}](${track.url})` + " - `" + track.durationFormatted + "`").join("\n\n"));

            const random_num = new Date().getTime();

            const selectMenu = new MessageSelectMenu()
                .setCustomId("search_menu" + `_active${random_num}`)
                .setOptions(
                    res.tracks.map((track, i) => {
                        return {
                            label: track.title,
                            description: track.channel + " - " + track.durationFormatted,
                            value: (i + 1).toString()
                        }
                    })
                )
                .setPlaceholder("Select a Song")
                .setMinValues(1)
                .setMaxValues(1);

            const row = new MessageActionRow()
                .addComponents([selectMenu]);

            interaction.reply({ embeds: [embed], components: [row] });

            const collector = interaction.channel.createMessageComponentCollector({
                time: 60000,
                errors: ["time"],
                filter: x => x.user.id === interaction.user.id
            });

            collector.on("collect", async (_interaction) => {
                if (!_interaction.isSelectMenu()) return;

                if (_interaction.customId === "search_menu" + `_active${random_num}`) {
                    await _interaction.deferUpdate();

                    await interaction.editReply({ content: "\u200B", embeds: [], components: []});
                    collector.stop();

                    if (serverQueue.state !== State.CONNECTED) {
                        const botPermissionsForVoice = voiceChannel.permissionsFor(interaction.guild.me);
                        if (!botPermissionsForVoice.has(Permissions.FLAGS.CONNECT)) return interaction.channel.send(client.emotes.permissionError + " **I do not have permission to Connect in** " + "`" + voiceChannel.name + "`");
                        if (!botPermissionsForVoice.has(Permissions.FLAGS.SPEAK)) return interaction.channel.send(client.emotes.permissionError + " **I do not have permission to Speak in** " + "`" + voiceChannel.name + "`");

                        try {
                            await serverQueue.connect(voiceChannel);
                        } catch {
                            serverQueue.destroy();
                            return interaction.channel.send(client.emotes.error + " **Error joining** <#" + voiceChannel.id + ">");
                        }

                        interaction.channel.send(client.emotes.success + " **Successfully joined <#" + voiceChannel.id + "> and bound to** <#" + interaction.channel.id + ">");
                    }

                    if (serverQueue.tracks.length > 0) {
                        serverQueue.tracks.push(res.tracks[_interaction.values[0] - 1]);
                        interaction.channel.send({ embeds: [buildTrack(res.tracks[_interaction.values[0] - 1], serverQueue)] });
                    } else {
                        serverQueue.tracks.push(res.tracks[_interaction.values[0] - 1]);
                        await serverQueue.play();
                    }

                } else return;
            });

            collector.on("end", (collection, reason) => {
                if (reason === "time") {
                    interaction.editReply({ content: client.emotes.error + " **Timeout**", embeds: [], components: [] });
                }
            });
        } else if (res.loadType === LoadType.NO_MATCHES) return interaction.reply(client.emotes.error + " **No results found**");
        else if (res.loadType === LoadType.LOAD_FAILED) return interaction.reply(client.emotes.error + " **Error searching** `" + res.exception.message + "`");
    }
}