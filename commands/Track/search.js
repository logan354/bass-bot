const { MessageEmbed } = require("discord.js");

const { Queue } = require("../../structures/Queue");
const { buildTrack } = require("../../utils/builders");
const { LoadType, State, QueryTypes } = require("../../utils/constants");

module.exports = {
    name: "search",
    aliases: ["find"],
    category: "Track",
    description: "Searches for a song via your query and returns the top 10 results.",
    utilisation: "{prefix}search <query>",
    permissions: {
        channel: [],
        member: [],
    },

    async execute(client, message, args) {
        let serverQueue = client.queues.get(message.guild.id);
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");

        if (!args[0]) return message.channel.send(client.emotes.error + " **Invalid input:** `" + this.utilisation.replace("{prefix}", client.config.app.prefix) + "`");

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
                .setAuthor("Search results for " + query, client.config.app.logo)
                .setDescription(res.tracks.map((track, i) => "`" + (i + 1) + ".` " + `[${track.title}](${track.url})\n` + "`" + track.durationFormatted + "`").join("\n\n") + "\n\n**Type a number to make a choice. Type `cancel` to exit**");

            const sentEmbed = await message.channel.send({ embeds: [embed] });

            const collector = message.channel.createMessageCollector({
                time: 60000,
                errors: ["time"],
                filter: m => m.author.id === message.author.id
            });

            collector.on("collect", async (query) => {
                if (query.content.toLowerCase() === "cancel") {
                    sentEmbed.delete();
                    message.channel.send(client.emotes.success + " **Cancelled**");
                    collector.stop();
                    return;
                }

                const value = Number(query.content);

                if (!value || value <= 0 || value > res.tracks.length) return message.channel.send(client.emotes.error + " **Invalid input:** `Pick a value between 1 and " + res.tracks.length + "`");

                sentEmbed.delete();
                collector.stop();

                if (serverQueue.state !== State.CONNECTED) {
                    try {
                        await serverQueue.connect();
                    } catch {
                        serverQueue.destroy();
                        return message.channel.send(client.emotes.error + " **Error joining** <#" + voiceChannel.id + ">");
                    }

                    message.channel.send(client.emotes.success + " **Successfully joined <#" + voiceChannel.id + "> and bound to** <#" + message.channel.id + ">");
                }

                if (serverQueue.tracks.length > 0) {
                    serverQueue.tracks.push(res.tracks[query.content - 1]);
                    message.channel.send({ embeds: [buildTrack(res.tracks[query.content - 1], serverQueue)] });
                } else {
                    serverQueue.tracks.push(res.tracks[query.content - 1]);
                    await serverQueue.play();
                }
            });

            collector.on("end", (message, reason) => {
                if (reason === "time") {
                    sentEmbed.delete();
                    message.channel.send(client.emotes.error + " **Timeout**");
                }
            });
        }
        else if (res.loadType === LoadType.NO_MATCHES) return message.channel.send(client.emotes.error + " **No results found for** `" + query + "`");
        else if (res.loadType === LoadType.LOAD_FAILED) return message.channel.send(client.emotes.error + " **Error searching for** `" + query + "`");
    }
}