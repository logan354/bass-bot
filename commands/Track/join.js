const Queue = require("../../structures/Queue");

module.exports = {
    name: "join",
    aliases: ["summon"],
    category: "Track",
    description: "Summons the bot to the voice channel you are in.",
    utilisation: "{prefix}join",

    async execute(client, message, args) {
        let voiceChannel = message.member.voice.channel;
        let textChannel = message.channel;
        let serverQueue = client.queues.get(message.guild.id);

        if (!voiceChannel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT")) return message.channel.send(client.emotes.error + " **I do not have permission to connect to** " + "`" + voiceChannel.name + "`");
        if (!permissions.has("SPEAK")) return message.channel.send(client.emotes.error + " **I do not have permission to speak in** " + "`" + voiceChannel.name + "`");

        if (!serverQueue) {
            serverQueue = new Queue(message);
            client.queues.set(message.guild.id, serverQueue);
        }

        try {
            const connection = await voiceChannel.join();
            serverQueue.connection = connection;
            connection.voice.setSelfDeaf(true);
        } catch (ex) {
            console.log(ex);
            return message.channel.send(client.emotes.error + " **Error: Joining:** `" + voiceChannel.name + "`");
        }
        message.channel.send(client.emotes.success + " **Successfully joined `" + voiceChannel.name + "` and bound to** <#" + textChannel.id + ">");
    }
}