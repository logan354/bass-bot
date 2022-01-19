const { Client, CommandInteraction, CommandInteractionOptionResolver, Permissions } = require("discord.js");

const Queue = require("../../structures/Queue");

module.exports = {
    name: "join",
    category: "Track",
    description: "Summons the bot to your voice channel",

    /**
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     * @param {CommandInteractionOptionResolver} args 
     */
    async execute(client, interaction, args) {
        let serverQueue = client.queues.get(interaction.guild.id);
        const voiceChannel = interaction.member.voice.channel;

        const botPermissionsFor = interaction.channel.permissionsFor(interaction.guild.me);
        if (!botPermissionsFor.has(Permissions.FLAGS.USE_EXTERNAL_EMOJIS)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Use External Emojis in** " + "`" + interaction.channel.name + "`");

        if (!voiceChannel) return interaction.reply(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (!serverQueue) {
            serverQueue = new Queue(client, {
                guildId: interaction.guild.id,
                voiceChannel: voiceChannel,
                textChannel: interaction.channel
            });
        }

        const botPermissionsForVoice = voiceChannel.permissionsFor(interaction.guild.me);
        if (!botPermissionsForVoice.has(Permissions.FLAGS.CONNECT)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Connect in** " + "`" + voiceChannel.name + "`");
        if (!botPermissionsForVoice.has(Permissions.FLAGS.SPEAK)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Speak in** " + "`" + voiceChannel.name + "`");

        try {
            await serverQueue.connect(voiceChannel);
        } catch {
            serverQueue.destroy();
            return interaction.reply(client.emotes.error + " **Error joining** <#" + voiceChannel.id + ">");
        }
        interaction.reply(client.emotes.success + " **Successfully joined <#" + voiceChannel.id + "> and bound to** <#" + interaction.channel.id + ">");
    }
}