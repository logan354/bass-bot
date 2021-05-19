const { resume } = require("../../src/Modules");

module.exports = {
    name: "resume",
    aliases: ["re", "res", "continue"],
    category: "Track",
    utilisation: "{prefix}resume",

    execute(client, message, args) {

        //Variables
        let voiceChannel = message.member.voice.channel;
        let textChannel = message.channel;

        const serverQueue = message.client.queue.get(message.guild.id);

        //Command Rules
        if (!voiceChannel) return message.channel.send(":x: - **You have to be in a voice channel to use this command**");

        if (!message.guild.me.voice.channel) return message.channel.send(":x: - **I am not connected to a voice channel.** Type " + "`" + client.config.discord.prefix + "join" + "`" + " to get me in one");

        if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(":x: - **You need to be in the same voice channel as Bass to use this command**");


        resume(message)

    }
}