const { Client, CommandInteraction, CommandInteractionOptionResolver, Permissions } = require("discord.js");

const { Queue } = require("../../structures/Queue");

const { buildTrack, buildPlaylist } = require("../../utils/builders");
const { LoadType, State } = require("../../utils/constants");
const { resolveQueryType } = require("../../utils/queryResolver");

const resume = require("./resume");

module.exports = {
    name: "play",
    category: "Track",
    description: "Adds a requested song to the queue",
    options: [
        {
            name: "query",
            description: "Enter a link/query",
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
            serverQueue = new Queue(client, {
                guildId: interaction.guild.id,
                voiceChannel: voiceChannel,
                textChannel: interaction.channel
            });
        }

        if (serverQueue.state !== State.CONNECTED) {
            const botPermissionsForVoice = voiceChannel.permissionsFor(interaction.guild.me);
            if (!botPermissionsForVoice.has(Permissions.FLAGS.CONNECT)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Connect in** " + "`" + voiceChannel.name + "`");
            if (!botPermissionsForVoice.has(Permissions.FLAGS.SPEAK)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Speak in** " + "`" + voiceChannel.name + "`");

            try {
                await serverQueue.connect();
            } catch {
                serverQueue.destroy();
                return interaction.reply(client.emotes.error + " **Error joining** <#" + voiceChannel.id + ">");
            }
            await interaction.reply(client.emotes.success + " **Successfully joined <#" + voiceChannel.id + "> and bound to** <#" + interaction.channel.id + ">");
        }

        // Create query and query type
        const query = args.getString("query");
        const queryType = resolveQueryType(query);

        // Searching interaction
        let searchEmoji;
        if (queryType.includes("youtube")) searchEmoji = client.emotes.youtube;
        if (queryType.includes("soundcloud")) searchEmoji = client.emotes.soundcloud;
        if (queryType.includes("spotify")) searchEmoji = client.emotes.spotify;

        if (interaction.replied) interaction.channel.send(searchEmoji + " **Searching...** :mag_right: `" + query + "`");
        else interaction.reply(searchEmoji + " **Searching...** :mag_right: `" + query + "`");

        // Search the users query
        const res = await serverQueue.search(query, { queryType: queryType, requester: interaction.user });
        if (res.loadType === LoadType.TRACK_LOADED) {
            if (serverQueue.tracks.length > 0) {
                serverQueue.tracks.push(res.tracks[0]);
                interaction.channel.send({ embeds: [buildTrack(res.tracks[0], serverQueue)] });
            } else {
                serverQueue.tracks.push(res.tracks[0]);
                await serverQueue.play();
            }
        } else if (res.loadType === LoadType.PLAYLIST_LOADED) {
            if (serverQueue.tracks.length > 0) {
                serverQueue.tracks.push(...res.tracks);
                interaction.channel.send({ embeds: [buildPlaylist(res.tracks, res.playlist, serverQueue)] });
            } else {
                serverQueue.tracks.push(...res.tracks);
                interaction.channel.send({ embeds: [buildPlaylist(res.tracks, res.playlist, serverQueue)] });
                await serverQueue.play();
            }
        } else if (res.loadType === LoadType.NO_MATCHES) return interaction.channel.send(client.emotes.error + " **No results found for** `" + query + "`");
        else if (res.loadType === LoadType.LOAD_FAILED) return interaction.channel.send(client.emotes.error + " **Error searching for** `" + query + "`");
    }
}
