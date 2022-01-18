const { Client, Message, Permissions, MessageEmbed, MessageSelectMenu, MessageActionRow } = require("discord.js");

const { Queue } = require("../../structures/Queue");

const { buildTrack } = require("../../utils/builders");
const { LoadType, State, QueryTypes } = require("../../utils/constants");

module.exports = {
    name: "search",
    aliases: ["find"],
    category: "Track",
    description: "Shows a list of songs that match the search query",
    utilisation: "{prefix}search <query>",

    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {string[]} args 
     */
    async execute(client, message, args) {
        let serverQueue = client.queues.get(message.guild.id);
        const voiceChannel = message.member.voice.channel;

        const botPermissionsFor = message.channel.permissionsFor(message.guild.me);
        if (!botPermissionsFor.has(Permissions.FLAGS.USE_EXTERNAL_EMOJIS)) return message.channel.send(client.emotes.permissionError + " **I do not have permission to Use External Emojis in** " + "`" + message.channel.name + "`");
        if (!botPermissionsFor.has(Permissions.FLAGS.EMBED_LINKS)) return message.channel.send(client.emotes.permissionError + " **I do not have permission to Embed Links in** " + "`" + message.channel.name + "`");

        if (!voiceChannel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");

        if (!args[0]) return message.channel.send(client.emotes.error + " **A query is required**");

        if (!serverQueue) {
            serverQueue = new Queue(client, {
                guildId: message.guild.id,
                voiceChannel: voiceChannel,
                textChannel: message.channel
            });
        }

        // Create query and query type
        const query = args.join(" ");
        const queryType = QueryTypes.YOUTUBE_SEARCH;

        // Search the users query
        const res = await serverQueue.search(query, { queryType: queryType, requester: message.author });
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

            const sentMessage = await message.channel.send({ embeds: [embed], components: [row] });

            const collector = message.channel.createMessageComponentCollector({
                time: 60000,
                errors: ["time"],
                filter: x => x.user.id === message.author.id
            });

            collector.on("collect", async (interaction) => {
                if (!interaction.isSelectMenu()) return;

                if (interaction.customId === "search_menu" + `_active${random_num}`) {
                    await interaction.deferUpdate();

                    sentMessage.edit({ content: "\u200B", embeds: [], components: [] });
                    collector.stop();

                    if (serverQueue.state !== State.CONNECTED) {
                        const botPermissionsForVoice = voiceChannel.permissionsFor(message.guild.me);
                        if (!botPermissionsForVoice.has(Permissions.FLAGS.CONNECT)) return message.channel.send(client.emotes.permissionError + " **I do not have permission to Connect in** " + "`" + voiceChannel.name + "`");
                        if (!botPermissionsForVoice.has(Permissions.FLAGS.SPEAK)) return message.channel.send(client.emotes.permissionError + " **I do not have permission to Speak in** " + "`" + voiceChannel.name + "`");

                        try {
                            await serverQueue.connect();
                        } catch {
                            serverQueue.destroy();
                            return message.channel.send(client.emotes.error + " **Error joining** <#" + voiceChannel.id + ">");
                        }

                        message.channel.send(client.emotes.success + " **Successfully joined <#" + voiceChannel.id + "> and bound to** <#" + message.channel.id + ">");
                    }

                    if (serverQueue.tracks.length > 0) {
                        serverQueue.tracks.push(res.tracks[interaction.values[0] - 1]);
                        message.channel.send({ embeds: [buildTrack(res.tracks[interaction.values[0] - 1], serverQueue)] });
                    } else {
                        serverQueue.tracks.push(res.tracks[interaction.values[0] - 1]);
                        await serverQueue.play();
                    }

                } else return;
            });

            collector.on("end", (collection, reason) => {
                if (reason === "time") {
                    sentMessage.edit({ content: client.emotes.error + " **Timeout**", embeds: [], components: [] });
                }
            });
        }
        else if (res.loadType === LoadType.NO_MATCHES) return message.channel.send(client.emotes.error + " **No results found for** `" + query + "`");
        else if (res.loadType === LoadType.LOAD_FAILED) return message.channel.send(client.emotes.error + " **Error searching for** `" + query + "`");
    }
}