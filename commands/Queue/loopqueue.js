const { Client, Message, Permissions } = require("discord.js");

module.exports = {
    name: "loopqueue",
    aliases: ["qloop", "lq", "queueloop"],
    category: "Queue",
    description: "Toggles looping the entire queue",
    utilisation: "{prefix}loopqueue",

    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {string[]} args 
     */
    execute(client, message, args) {
        const serverQueue = client.queues.get(message.guild.id);
        const voiceChannel = message.member.voice.channel;
        
        const botPermissionsFor = message.channel.permissionsFor(message.guild.me);
        if (!botPermissionsFor.has(Permissions.FLAGS.USE_EXTERNAL_EMOJIS)) return message.channel.send(client.emotes.permissionError + " **I do not have permission to Use External Emojis in** " + "`" + message.channel.name + "`");

        if (!voiceChannel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (!message.guild.me.voice.channel) return message.channel.send(client.emotes.error + " **I am not connected to a voice channel.** Type " + "`" + client.config.app.prefix + "join" + "`" + " to get me in one");

        if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");

        if (serverQueue.loopQueue) {
            serverQueue.loopQueue = false
            return message.channel.send(client.emotes.loopQueue + " **Disabled**");
        }
        else {
            serverQueue.loopQueue = true
            return message.channel.send(client.emotes.loopQueue + " **Enabled**");
        }
    }
}