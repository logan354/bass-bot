const { handleEndCooldown } = require("../../structures/Cooldowns");
const Queue = require("../../structures/Queue");
const { searchTracks } = require("../../structures/Search");

module.exports = {
    name: "play",
    aliases: ["p"],
    category: "Track",
    description: "Plays a song with the given name or url.",
    utilisation: "{prefix}play <link/query>",

    async execute(client, message, args) {
        let voiceChannel = message.member.voice.channel;
        let textChannel = message.channel;
        let serverQueue = client.queues.get(message.guild.id);

        if (!voiceChannel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");

        if (!message.guild.me.voice.channel) if (!args[0]) return message.channel.send(client.emotes.error + " **Invalid usage:** " + "`" + client.config.discord.prefix + "play [Link or query]" + "`");

        if (!args[0]) {
            //resume
            return;
        }

        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT")) return message.channel.send(client.emotes.error + " **I do not have permission to connect to** " + "`" + voiceChannel.name + "`");
        if (!permissions.has("SPEAK")) return message.channel.send(client.emotes.error + " **I do not have permission to speak in** " + "`" + voiceChannel.name + "`");

        if (!message.guild.me.voice.channel) {
            if (!serverQueue) {
                serverQueue = new Queue(message);
                client.queues.set(message.guild.id, serverQueue);
            }

            try {
                const connection = await voiceChannel.join();
                serverQueue.connection = connection;
                connection.voice.setSelfDeaf(true);
                handleEndCooldown(message);
            } catch (ex) {
                console.log(ex);
                return message.channel.send(client.emotes.error + " **Error: Joining:** `" + voiceChannel.name + "`");
            }
            message.channel.send(client.emotes.success + " **Successfully joined `" + voiceChannel.name + "` and bound to** <#" + textChannel.id + ">");
        }

        searchTracks(message, args.join(" "));
    }
}