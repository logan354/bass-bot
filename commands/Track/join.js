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

        if (!serverQueue) {
            serverQueue = new Queue(message.guild.id);
            client.queues.set(message.guild.id, serverQueue);
        }

        try {
            await serverQueue.connect(message, voiceChannel);
        } catch {
            client.queues.delete(message.guild.id);
            message.channel.send(client.emotes.error + " **An error occurred while joining** <#" + voiceChannel.name + ">");
        }

        message.channel.send(client.emotes.success + " **Successfully joined <#" + voiceChannel.id + "> and bound to** <#" + message.channel.id + ">");
    },

    slashCommand: {
        options: [],

        async execute(client, interaction, args) {
            let serverQueue = client.queues.get(interaction.guild.id);
            const voiceChannel = interaction.member.voice.channel;
    
            if (!voiceChannel) return interaction.reply(client.emotes.error + " **You have to be in a voice channel to use this command*");
    
            interaction.deferReply();

            if (!serverQueue) {
                serverQueue = new Queue(interaction.guild.id);
                client.queues.set(interaction.guild.id, serverQueue);
            }
    
            try {
                await serverQueue.connect(interaction, voiceChannel);
            } catch {
                client.queues.delete(interaction.guild.id);
                interaction.followUp(client.emotes.error + " **An error occurred while joining** <#" + voiceChannel.name + ">");
            }
    
            interaction.followUp(client.emotes.success + " **Successfully joined <#" + voiceChannel.id + "> and bound to** <#" + interaction.channel.id + ">");
        }
    }
}