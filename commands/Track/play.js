const { Queue } = require("../../structures/Queue");
const { buildTrack, buildPlaylist } = require("../../utils/builders");
const { LoadType, State } = require("../../utils/constants");
const { resolveQueryType } = require("../../utils/queryResolver");

//const resume = require("./resume");

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

        if (!args[0]) return //resume.execute(client, message, args);

        if (!serverQueue) {
            serverQueue = new Queue(client, {
                guildId: message.guild.id,
                voiceChannel: voiceChannel,
                textChannel: message.channel
            });
        }

        if (serverQueue.state !== State.CONNECTED) {
            try {
                await serverQueue.connect();
            } catch {
                serverQueue.destroy();
                return message.channel.send(client.emotes.error + " **An error occurred while joining** <#" + voiceChannel.id + ">");
            }
            message.channel.send(client.emotes.success + " **Successfully joined <#" + voiceChannel.id + "> and bound to** <#" + message.channel.id + ">");
        }

        // Create query and query type
        const query = args.join(" ");
        const queryType = resolveQueryType(query);

        // Searching message
        let searchEmoji;
        if (queryType.includes("youtube")) searchEmoji = client.emotes.youtube;
        if (queryType.includes("soundcloud")) searchEmoji = client.emotes.soundcloud;
        if (queryType.includes("spotify")) searchEmoji = client.emotes.spotify;
        message.channel.send(searchEmoji + " **Searching...** :mag_right: `" + query + "`");

        // Search the users query
        const res = await serverQueue.search(query, { queryType: queryType, requester: message.author });
        if (res.loadType === LoadType.TRACK_LOADED) {
            if (serverQueue.tracks.length > 0) {
                serverQueue.tracks.push(res.tracks[0]);
                message.channel.send({ embeds: [buildTrack(res.tracks[0], serverQueue)] });
            } else {
                serverQueue.tracks.push(res.tracks[0]);
                await serverQueue.play();
            }
        } else if (res.loadType === LoadType.PLAYLIST_LOADED) {
            if (serverQueue.tracks.length > 0) {
                serverQueue.tracks.push(...res.tracks);
                message.channel.send({ embeds: [buildPlaylist(res.tracks, res.playlist, serverQueue)] });
            } else {
                serverQueue.tracks.push(...res.tracks);
                message.channel.send({ embeds: [buildPlaylist(res.tracks, res.playlist, serverQueue)] });
                await serverQueue.play();
            }
        } else if (res.loadType === LoadType.NO_MATCHES) return message.channel.send(client.emotes.error + " **No results found for** `" + query + "`");
        else if (res.loadType === LoadType.LOAD_FAILED) return message.channel.send(client.emotes.error + " **An error occurred while searching for** `" + query + "`");
    }
}
