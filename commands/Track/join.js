const { Queue } = require("../../structures/Queue");

module.exports = {
    name: "join",
    aliases: ["summon"],
    category: "Track",
    description: "Summons the bot to your voice channel",
    utilisation: "{prefix}join",
    permissions: {
        channel: [],
        member: [],
    },

    async execute(client, message, args) {
        let serverQueue = client.queues.get(message.guild.id);
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (!serverQueue) {
            serverQueue = new Queue(client, {
                guildId: message.guild.id,
                voiceChannel: voiceChannel,
                textChannel: message.channel
            });
        }

        try {
            await serverQueue.connect(voiceChannel);
        } catch {
            serverQueue.destroy();
            return message.channel.send(client.emotes.error + " **Error joining** <#" + voiceChannel.id + ">");
        }
        message.channel.send(client.emotes.success + " **Successfully joined <#" + voiceChannel.id + "> and bound to** <#" + message.channel.id + ">");
    }
}