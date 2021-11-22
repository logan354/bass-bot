const { Queue } = require("../../src/Queue");
const { Util } = require("../../src/Utils");

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
            serverQueue = new Queue(client, {
                guildId: message.guild.id,
                voiceChannel: voiceChannel,
                textChannel: message.channel
            });

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
        const queryType = Util.resolveQueryType(query);

        // Searching message
        let searchEmoji;
        if (queryType.includes("youtube")) searchEmoji = client.emotes.youtube;
        if (queryType.includes("soundcloud")) searchEmoji = client.emotes.soundcloud;
        if (queryType.includes("spotify")) searchEmoji = client.emotes.spotify;
        message.channel.send(searchEmoji + " **Searching...** :mag_right: `" + query + "`");

        // Search the users query
        const res = await serverQueue.search(query, { queryType: queryType, requester: message.author });
        if (res.loadType === "TRACK_LOADED") {
            if (serverQueue.tracks.length > 0) {
                serverQueue.tracks.push(res.tracks[0]);
                // Added to queue message
            } else {
                serverQueue.tracks.push(res.tracks[0]);
                await serverQueue.play();
            }
        } else if (res.loadType === "PLAYLIST_LOADED") {
            if (serverQueue.tracks.length > 0) {
                serverQueue.tracks.push(...res.tracks);
                // Added to queue message
            } else {
                serverQueue.tracks.push(...res.tracks);
                // Added to queue message
                await serverQueue.play();
            }
        } else if (res.loadType === "NO_MATCHES") return message.channel.send(client.emotes.error + " **No results found for** `" + query + "`");
        else if (res.loadType === "LOAD_FAILED") return message.channel.send(client.emotes.error + " **An error occurred while searching for `" + query + "`");
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
