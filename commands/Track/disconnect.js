const { Client, Message, Permissions } = require("discord.js");

module.exports = {
    name: "disconnect",
    aliases: ["dc", "leave", "dis"],
    category: "Track",
    description: "Disconnects Bass from the voice channel",
    utilisation: "{prefix}disconnect",

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

        if (!message.guild.me.voice.channel) return message.channel.send(client.emotes.error + " **I am not connected to a voice channel.** Type " + "`" + client.config.app.prefix + "join" + "`" + " to get me in one");

        const voiceChannelSize = voiceChannel.members.filter(m => !m.user.bot).size;
        if (voiceChannelSize > 1 && !message.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) return message.channel.send(client.emotes.permissionError + " **This command requires you to have the Manage Channels permission to use it (being alone with the bot also works)**");

        serverQueue.destroy();
        message.channel.send(client.emotes.disconnect + " **Successfully disconnected**");
    }
}