const { Client, Message, Permissions } = require("discord.js");

const { Queue } = require("../../structures/Queue");

module.exports = {
    name: "join",
    aliases: ["summon"],
    category: "Track",
    description: "Summons the bot to your voice channel",
    utilisation: "{prefix}join",

    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {string[]} args 
     */
    async execute(client, message, args) {
        let serverQueue = client.queues.get(message.guild.id);
        const voiceChannel = message.member.voice.channel;

        const botPermissionsFor = message.channel.permissionsFor(message.guild.me);
        if (!botPermissionsFor.has(Permissions.FLAGS.USE_EXTERNAL_EMOJIS)) return message.channel.send(client.emotes.permissionError + " **I do not have permission to Use External Emojis in** " + "`" + message.channel.name + "`");

        if (!voiceChannel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (!serverQueue) {
            serverQueue = new Queue(client, {
                guildId: message.guild.id,
                voiceChannel: voiceChannel,
                textChannel: message.channel
            });
        }

        const botPermissionsForVoice = voiceChannel.permissionsFor(message.guild.me);
        if (!botPermissionsForVoice.has(Permissions.FLAGS.CONNECT)) return message.channel.send(client.emotes.permissionError + " **I do not have permission to Connect in** " + "`" + voiceChannel.name + "`");
        if (!botPermissionsForVoice.has(Permissions.FLAGS.SPEAK)) return message.channel.send(client.emotes.permissionError + " **I do not have permission to Speak in** " + "`" + voiceChannel.name + "`");

        try {
            await serverQueue.connect(voiceChannel);
        } catch {
            serverQueue.destroy();
            return message.channel.send(client.emotes.error + " **Error joining** <#" + voiceChannel.id + ">");
        }
        message.channel.send(client.emotes.success + " **Successfully joined <#" + voiceChannel.id + "> and bound to** <#" + message.channel.id + ">");
    }
}