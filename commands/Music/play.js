const { Client, Message, PermissionsBitField } = require("discord.js");
const MusicSubscription = require("../../structures/MusicSubscription");
const { buildTrack, buildPlaylist } = require("../../utils/builders");
const { LoadType } = require("../../utils/constants");
const { resolveQueryType } = require("../../utils/queryResolver");

module.exports = {
    name: "play",
    aliases: ["p"],
    category: "Track",
    description: "Adds a requested song to the queue",
    utilisation: "{prefix}play [link/query]",

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
        if (!botPermissionsFor.has(PermissionsBitField.Flags.UseExternalEmojis)) return message.channel.send(client.emotes.permissionError + " **I do not have permission to Use External Emojis in** <#" + message.channel.id + "`");
        if (!botPermissionsFor.has(PermissionsBitField.Flags.EmbedLinks)) return message.channel.send(client.emotes.permissionError + " **I do not have permission to Embed Links in** <#" + message.channel.id + ">");

        if (!message.member.voice.channel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (subscription && subscription.connection && message.member.voice.channel.id !== subscription.voiceChannel.id) return message.channel.send(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");

        if (!args[0]) return message.channel.send(client.emotes.error + " **A link or query is required**");

        if (!subscription) {
            subscription = new MusicSubscription(client, message.guild.id, message.channel);
        }

        if (!subscription.connection) {
            const botPermissionsForVoice = message.member.voice.channel.permissionsFor(message.guild.members.me);
            if (!botPermissionsForVoice.has(PermissionsBitField.Flags.Connect)) return message.channel.send(client.emotes.permissionError + " **I do not have permission to Connect in** <#" + message.member.voice.channel.id + ">");
            if (!botPermissionsForVoice.has(PermissionsBitField.Flags.Speak)) return message.channel.send(client.emotes.permissionError + " **I do not have permission to Speak in** <#" + message.member.voice.channel.id + ">");

            try {
                await subscription.connect(message.member.voice.channel);
            } catch {
                subscription.destroy();
                return message.channel.send(client.emotes.error + " **Error joining** <#" + message.member.voice.channel.id + ">");
            }

            message.channel.send(client.emotes.success + " **Joined <#" + message.member.voice.channel.id + "> and bound to** <#" + message.channel.id + ">");
        }

        // Generate query and resolve type
        const query = args.join(" ");
        const queryType = resolveQueryType(query);

        let searchEmoji;
        if (queryType.includes("YOUTUBE")) searchEmoji = client.emotes.youtube;
        if (queryType.includes("SPOTIFY")) searchEmoji = client.emotes.spotify;
        if (queryType.includes("SOUNDCLOUD")) searchEmoji = client.emotes.soundcloud;
        message.channel.send(searchEmoji + " **Searching...** :mag_right: `" + query + "`");

        // Search the query
        const res = await subscription.search(query, message.author, { queryType: queryType });
        if (res.loadType === LoadType.TRACK_LOADED || res.loadType === LoadType.SEARCH_RESULT) {
            if (subscription.queue.length > 0) {
                subscription.queue.push(res.tracks[0]);
                message.channel.send({ embeds: [buildTrack(subscription, res.tracks[0])] });
            } else {
                subscription.queue.push(res.tracks[0]);
                await subscription.play();
            }
        } else if (res.loadType === LoadType.PLAYLIST_LOADED) {
            if (subscription.queue.length > 0) {
                subscription.queue.push(...res.tracks);
                message.channel.send({ embeds: [buildPlaylist(res.tracks, res.playlist, subscription)] });
            } else {
                subscription.queue.push(...res.tracks);
                message.channel.send({ embeds: [buildPlaylist(res.tracks, res.playlist, subscription)] });
                await subscription.play();
            }
        } else if (res.loadType === LoadType.NO_MATCHES) return message.channel.send(client.emotes.error + " **No results found**");
        else if (res.loadType === LoadType.LOAD_FAILED) return message.channel.send(client.emotes.error + " **Error searching** `" + res.exception.message + "`");
    }
}