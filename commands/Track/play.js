const Queue = require("../../src/constructors/Queue");
const { player } = require("../../src/structures/Player");
const { search } = require("../../src/structures/Search");
const { buildTrack, buildPlaylist, buildNowPlaying } = require("../../src/utils/builders");
const { resolveQueryType } = require("../../src/utils/queryResolver");
const { ErrorStatusCodes } = require("../../src/utils/types");

module.exports = {
    name: "play",
    aliases: ["p"],
    category: "Track",
    description: "Plays a song with the given name or url.",
    utilisation: "{prefix}play <link/query>",
    permissions: {
        channel: [],
        member: [],
    },

    async execute(client, message, args) {
        let serverQueue = client.queues.get(message.guild.id);
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");

        if (!message.guild.me.voice.channel) if (!args[0]) return message.channel.send(client.emotes.error + " **Invalid input:** `" + this.utilisation.replace("{prefix}", client.config.app.prefix) + "`");

        if (!args[0]) return resume.execute(client, message, args);

        // Create queue and connect the queue
        if (!serverQueue) {
            serverQueue = new Queue(message.guild.id);

            try {
                await serverQueue.connect(message, voiceChannel);
            } catch {
                message.channel.send(client.emotes.error + " **An error occurred while joining** <#" + voiceChannel.id + ">");
            }

            client.queues.set(message.guild.id, serverQueue);
            message.channel.send(client.emotes.success + " **Successfully joined <#" + voiceChannel.id + "> and bound to** <#" + message.channel.id + ">");
        }

        // Create query and query type
        const query = args.join(" ");
        const queryType = resolveQueryType(query);

        // Search message
        let searchEmoji;
        if (queryType.includes("youtube")) searchEmoji = client.emotes.youtube;
        if (queryType.includes("soundcloud")) searchEmoji = client.emotes.soundcloud;
        if (queryType.includes("spotify")) searchEmoji = client.emotes.spotify;

        message.channel.send(searchEmoji + " **Searching...** :mag_right: `" + query + "`");

        // Search the users query
        const res = await search(query, message.author, queryType);

        if (res.track) {
            if (serverQueue.tracks.length > 0) {
                serverQueue.tracks.push(res.track);
                message.channel.send({ embeds: [buildTrack(client, serverQueue, res.track)] });
            } else {
                serverQueue.tracks.push(res.track);
                const currentTrack = await player(message, serverQueue.tracks[0]);
                message.channel.send(buildNowPlaying(client, serverQueue, currentTrack));
            }
        } else if (res.playlist) {
            if (serverQueue.tracks.length > 0) {
                serverQueue.tracks.push(...res.playlist.tracks);
            } else {
                serverQueue.tracks.push(...res.playlist.tracks);
                await player(message, serverQueue.tracks[0]);
            }

            message.channel.send({ embeds: [buildPlaylist(client, serverQueue, res.playlist)] });
        } else {
            if (res === ErrorStatusCodes.INVALID_LINK) return message.channel.send(client.emotes.error + " **Could not find that link**");
            if (res === ErrorStatusCodes.NO_RESULTS) return message.channel.send(client.emotes.error + " **No results found on YouTube for** `" + query + "`");
            if (res === ErrorStatusCodes.UNKNOWN_ERROR) return message.channel.send(client.emotes.error + " **An error occurred while searching** `" + query + "`");
        }
    },

    slashCommand: {
        options: [
            {
                name: "input",
                description: "Enter a query or link",
                required: true,
                type: 3
            }
        ],

        execute(client, interaction, args) {

        }
    }
}
