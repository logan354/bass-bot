const { ApplicationCommandOptionType, Client, CommandInteraction, CommandInteractionOptionResolver, PermissionsBitField, EmbedBuilder } = require("discord.js");
const MusicSubscription = require("../../structures/MusicSubscription");
const { LoadType } = require("../../utils/constants");
const { resolveQueryType } = require("../../utils/queryResolver");

module.exports = {
    name: "play",
    category: "Music",
    description: "Plays a requested song, or adds it to the queue.",
    utilisation: "play <link/query>",
    options: [
        {
            name: "link/query",
            description: "Enter a link or query",
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
        if (!botPermissionsFor.has(PermissionsBitField.Flags.UseExternalEmojis)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Use External Emojis in** <#" + interaction.channel.id + "`");
        if (!botPermissionsFor.has(PermissionsBitField.Flags.EmbedLinks)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Embed Links in** <#" + interaction.channel.id + ">");


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
        const query = args.getString("link/query").join(" ");
        const queryType = resolveQueryType(query);

        let searchEmoji;
        if (queryType.includes("YOUTUBE")) searchEmoji = client.emotes.youtube;
        if (queryType.includes("SPOTIFY")) searchEmoji = client.emotes.spotify;
        if (queryType.includes("SOUNDCLOUD")) searchEmoji = client.emotes.soundcloud;

        if (interaction.deferred) interaction.editReply(searchEmoji + " **Searching...** " + client.emotes.searching + " `" + query + "`");
        else interaction.reply(searchEmoji + " **Searching...** " + client.emotes.searching + " `" + query + "`");

        const res = await subscription.search(query, interaction.user, { queryType: queryType });
        if (res.loadType === LoadType.TRACK_LOADED || res.loadType === LoadType.SEARCH_RESULT) {
            subscription.queue.add(res.tracks[0]);

            const embed = new EmbedBuilder()
                .setColor("DarkGreen")
                .setAuthor({
                    name: "Queued",
                    iconURL: interaction.author.avatarURL()
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
                        value: "`" + res.tracks[0].durationFormatted + "`",
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
        } else if (res.loadType === LoadType.PLAYLIST_LOADED) {
            subscription.queue.add(res.tracks);

            const embed = new EmbedBuilder()
                .setColor("DarkGreen")
                .setAuthor({
                    name: "Queued",
                    iconURL: interaction.guild.iconURL()
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

            interaction.channel.send({ embeds: [embed] });

            if (!subscription.isPlaying()) {
                await subscription.play();
            }
        } else if (res.loadType === LoadType.NO_MATCHES) return interaction.channel.send(client.emotes.error + " **No results found**");
        else if (res.loadType === LoadType.LOAD_FAILED) return interaction.channel.send(client.emotes.error + " **Error searching**");
    }
}