const Queue = require("../../src/constructors/Queue");

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

        if (!voiceChannel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command*");

        // Different joining systems in case connecting the queue takes a long time
        if (!serverQueue) {
            serverQueue = new Queue(message.guild.id);

            try {
                await serverQueue.connect(message, voiceChannel);
            } catch {
                return message.channel.send(client.emotes.error + " **An error occurred while joining** <#" + voiceChannel.id + ">");
            }

            client.queues.set(message.guild.id, serverQueue);
            message.channel.send(client.emotes.success + " **Successfully joined <#" + voiceChannel.id + "> and bound to** <#" + message.channel.id + ">");
        } else {
            try {
                await serverQueue.connect(message, voiceChannel);
            } catch {
                return message.channel.send(client.emotes.error + " **An error occurred while joining** <#" + voiceChannel.id + ">");
            }

            message.channel.send(client.emotes.success + " **Successfully joined <#" + voiceChannel.id + "> and bound to** <#" + message.channel.id + ">");
        }
    },

    slashCommand: {
        options: [],

        async execute(client, interaction, args) {
            let serverQueue = client.queues.get(interaction.guild.id);
            const voiceChannel = interaction.member.voice.channel;

            if (!voiceChannel) return interaction.reply(client.emotes.error + " **You have to be in a voice channel to use this command*");

            interaction.deferReply();

            // Different joining systems in case connecting the queue takes a long time
            if (!serverQueue) {
                serverQueue = new Queue(interaction.guild.id);

                try {
                    await serverQueue.connect(interaction, voiceChannel);
                } catch {
                    return interaction.followUp(client.emotes.error + " **An error occurred while joining** <#" + voiceChannel.id + ">");
                }

                client.queues.set(interaction.guild.id, serverQueue);
                interaction.followUp(client.emotes.success + " **Successfully joined <#" + voiceChannel.id + "> and bound to** <#" + interaction.channel.id + ">");
            } else {
                try {
                    await serverQueue.connect(interaction, voiceChannel);
                } catch {
                    return interaction.followUp(client.emotes.error + " **An error occurred while joining** <#" + voiceChannel.id + ">");
                }

                interaction.followUp(client.emotes.success + " **Successfully joined <#" + voiceChannel.id + "> and bound to** <#" + interaction.channel.id + ">");
            }
        }
    }
}