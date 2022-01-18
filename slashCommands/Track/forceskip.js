const { Client, CommandInteraction, CommandInteractionOptionResolver, Permissions } = require("discord.js");

module.exports = {
    name: "forceskip",
    category: "Track",
    description: "Force skips the song that is currently playing",
    options: [
        {
            name: "value",
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

        if (!serverQueue.tracks.length) return interaction.reply(client.emotes.error + " **Nothing playing in this server**, let's get this party started! :tada:");

        const voiceChannelSize = voiceChannel.members.filter(m => !m.user.bot).size;
        if (voiceChannelSize > 1 && !interaction.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) return interaction.reply(client.emotes.permissionError + " **This command requires you to have the Manage Channels permission to use it (being alone with the bot also works)**");

        if (!args.getNumber("value")) {
            serverQueue.streamDispatcher.audioPlayer.stop();
            return interaction.reply(client.emotes.skip + " **Skipped**");
        }

        let skipNum = args.getNumber("value");

        if (skipNum <= 0) return interaction.reply(client.emotes.error + " **Value must be a number greater than 1**");

        if (skipNum > serverQueue.tracks.length) skipNum = serverQueue.tracks.length;

        // Skip single track
        if (skipNum === 1 || serverQueue.tracks.length === 1) {
            serverQueue.streamDispatcher.audioPlayer.stop();
            return interaction.reply(client.emotes.skip + " **Skipped**");
        } 

        // Skip multiple tracks
        for (let i = 0; i < skipNum - 1; i++) {
            serverQueue.tracks.shift();
        }

        serverQueue.streamDispatcher.audioPlayer.stop();
        return interaction.reply(client.emotes.skip + " **Skipped " + skipNum + " songs**");
    }
}
