const { handleStopCooldown } = require("../../structures/Cooldowns");

module.exports = {
    name: "pause",
    aliases: ["stop"],
    category: "Track",
    description: "Pauses the current playing track.",
    utilisation: "{prefix}pause",

    execute(client, message, args) {
        let voiceChannel = message.member.voice.channel;
        const serverQueue = client.queues.get(message.guild.id);

        if (!voiceChannel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (!message.guild.me.voice.channel) return message.channel.send(client.emotes.error + " **I am not connected to a voice channel.** Type " + "`" + client.config.discord.prefix + "join" + "`" + " to get me in one");

        if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");

        if (serverQueue.playing === false) return message.channel.send(client.emotes.error + " **The player is already paused**");

        if (serverQueue.tracks.length === 0) {
            serverQueue.playing = false;
            return message.channel.send(client.emotes.pause + " **Paused**");
        }

        try {
            serverQueue.connection.dispatcher.pause();
            serverQueue.playing = false;
            handleStopCooldown(message);
        } catch (ex) {
            console.log(ex);
            return message.channel.send(client.emotes.error + " **Error:** `Pausing`");
        }
        message.channel.send(client.emotes.pause + " **Paused**");
    }
}