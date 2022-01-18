const { Client, CommandInteraction, CommandInteractionOptionResolver, Permissions } = require("discord.js");

module.exports = {
    name: "volume",
    category: "Premium",
    description: "Check or change the current volume",
    options: [
        {
            name: "volume",
            description: "Enter a number",
            required: false,
            type: "NUMBER"
        }
    ],

    /**
     * @param {Client} client 
     * @param {CommandInteraction} interaction
     * @param {CommandInteractionOptionResolver} args 
     */
    execute(client, interaction, args) {
        const serverQueue = client.queues.get(interaction.guild.id);
        const voiceChannel = interaction.member.voice.channel;

        const botPermissionsFor = interaction.channel.permissionsFor(interaction.guild.me);
        if (!botPermissionsFor.has(Permissions.FLAGS.USE_EXTERNAL_EMOJIS)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Use External Emojis in** " + "`" + interaction.channel.name + "`");

        if (!voiceChannel) return interaction.reply(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (!interaction.guild.me.voice.channel) return interaction.reply(client.emotes.error + " **I am not connected to a voice channel.** Type " + "`" + client.config.app.prefix + "join" + "`" + " to get me in one");

        if (interaction.guild.me.voice.channel && interaction.member.voice.channel.id !== interaction.guild.me.voice.channel.id) return interaction.reply(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");

        if (!args.getNumber("volume")) return interaction.reply(client.emotes.volume + " **Volume level is currently " + serverQueue.volume + "%**");

        const volume = args.getNumber("volume");

        if (volume < 0 || volume > 200) return interaction.reply(client.emotes.error + " **Volume must be a number between 1 - 200**");

        if (!serverQueue.tracks.length) serverQueue.volume = volume;
        else {
            serverQueue.volume = volume;
            serverQueue.streamDispatcher.audioPlayer.state.resource.volume.setVolumeLogarithmic(serverQueue.volume / 100);
        }

        interaction.reply(client.emotes.volume + " **Volume level is now set to " + serverQueue.volume + "%**");
    }
}