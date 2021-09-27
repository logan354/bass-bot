module.exports = {
    name: "volume",
    aliases: ["vol"],
    category: "Premium",
    description: "Outputs the current volume.",
    utilisation: "{prefix}volume <1-200> – Changes the current volume.",

    execute(client, message, args) {
        let voiceChannel = message.member.voice.channel;
        const serverQueue = client.queues.get(message.guild.id);

        if (!voiceChannel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (!message.guild.me.voice.channel) return message.channel.send(client.emotes.error + " **I am not connected to a voice channel.** Type " + "`" + client.config.app.prefix + "join" + "`" + " to get me in one");

        if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");

        if (!args[0]) return message.channel.send(client.emotes.volume + " **Volume level: " + serverQueue.volume + "%**");

        const newVolumeLevel = args[0];
        const numberFormat = /^\d+$/;

        if (numberFormat.test(newVolumeLevel) && parseInt(newVolumeLevel) <= 200 && parseInt(newVolumeLevel) > 0) {
            serverQueue.volume = args[0];
            serverQueue.connection.dispatcher.setVolumeLogarithmic(serverQueue.volume / 100);
            message.channel.send(client.emotes.volume + " **Volume level: " + serverQueue.volume + "%**");
        }
        else return message.channel.send(client.emotes.error + " **Invalid input:** `" + this.utilisation.replace("{prefix}", client.config.app.prefix) + "`");
    }
}