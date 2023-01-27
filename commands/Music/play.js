const { Client, Message, PermissionsBitField, EmbedBuilder } = require("discord.js");
const MusicSubscription = require("../../structures/MusicSubscription");
const { LoadType } = require("../../utils/constants");
const { resolveQueryType } = require("../../utils/queryResolver");

module.exports = {
    name: "play",
    aliases: ["p"],
    category: "Music",
    description: "Plays a requested song, or adds it to the queue.",
    utilisation: "play <link/query>",

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


        if (!args[0]) return message.channel.send(client.emotes.error + " **A link/query is required**");


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
                return message.channel.send(client.emotes.error + " **Error connecting to ** <#" + message.member.voice.channel.id + ">");
            }
            message.channel.send(client.emotes.success + " **Connected to <#" + message.member.voice.channel.id + "> and bound to** <#" + message.channel.id + ">");
        }

        // Search the link/query and add to the queue
        const query = args.join(" ");
        const queryType = resolveQueryType(query);

        let searchEmoji;
        if (queryType.includes("YOUTUBE")) searchEmoji = client.emotes.youtube;
        if (queryType.includes("SPOTIFY")) searchEmoji = client.emotes.spotify;
        if (queryType.includes("SOUNDCLOUD")) searchEmoji = client.emotes.soundcloud;
        message.channel.send(searchEmoji + " **Searching...** " + client.emotes.searching + " `" + query + "`");

        const res = await subscription.search(query, message.author, { queryType: queryType });
        if (res.loadType === LoadType.TRACK_LOADED || res.loadType === LoadType.SEARCH_RESULT) {
            subscription.queue.add(res.tracks[0]);

            const embed = new EmbedBuilder()
                .setColor("DarkGreen")
                .setAuthor({
                    name: "Queued",
                    iconURL: message.author.avatarURL()
                })
                .setDescription(`**[${res.tracks[0].title}](${res.tracks[0].url})**`)
                .setFields(
                    {
                        name: "Channel",
                        value: res.tracks[0].channel,
                        inline: true
                    },
                    {
                        name: "Duration",
                        value: res.tracks[0].durationFormatted,
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
        } else if (res.loadType === LoadType.PLAYLIST_LOADED) {
            subscription.queue.add(res.tracks);

            const embed = new EmbedBuilder()
                .setColor("DarkGreen")
                .setAuthor({
                    name: "Queued",
                    iconURL: message.guild.iconURL()
                })
                .setDescription(`**[${res.playlist.title}](${res.playlist.url})**`)
                .setThumbnail(res.playlist.thumbnail)
                .setFields(
                    {
                        name: "Channel",
                        value: res.playlist.channel,
                        inline: true
                    },
                    {
                        name: "Enqueued",
                        value: "`" + res.tracks.length + "` songs",
                        inline: true
                    },
                    {
                        name: "Position in queue",
                        value: `${subscription.queue.length - res.tracks.length}`,
                        inline: true
                    }
                );

            message.channel.send({ embeds: [embed] });

            if (!subscription.isPlaying()) {
                await subscription.play();
            }
        } else if (res.loadType === LoadType.NO_MATCHES) return message.channel.send(client.emotes.error + " **No results found**");
        else if (res.loadType === LoadType.LOAD_FAILED) return message.channel.send(client.emotes.error + " **Error searching**");
    }
}