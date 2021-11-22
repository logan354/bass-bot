const { Queue } = require("../../src/Queue");

module.exports = {
    name: "join",
    aliases: ["summon"],
    category: "Track",
    description: "Summons the bot to the voice channel you are in.",
    utilisation: "{prefix}join",
    permissions: {
        channel: [],
        member: [],
    },

    async execute(client, message, args) {
        let serverQueue = client.queues.get(message.guild.id);
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

        // Different joining systems in case connecting the queue takes a long time
        if (!serverQueue) {
            serverQueue = new Queue(client, {
                guildId: message.guild.id,
                voiceChannel: voiceChannel,
                textChannel: message.channel
            });

            try {
                await serverQueue.connect();
            } catch {
                serverQueue.destroy();
                return message.channel.send(client.emotes.error + " **An error occurred while joining** <#" + voiceChannel.id + ">");
            }

            message.channel.send(client.emotes.success + " **Successfully joined <#" + voiceChannel.id + "> and bound to** <#" + message.channel.id + ">");
        } else {
            try {
                await serverQueue.connect(voiceChannel);
            } catch {
                serverQueue.destroy();
                return message.channel.send(client.emotes.error + " **An error occurred while joining** <#" + voiceChannel.id + ">");
            }

            message.channel.send(client.emotes.success + " **Successfully joined <#" + voiceChannel.id + "> and bound to** <#" + message.channel.id + ">");
        }
    },

    slashCommand: {
        options: [],

        async execute(client, interaction, args) {

        }
    }
}