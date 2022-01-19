const { Client, CommandInteraction, CommandInteractionOptionResolver, Permissions } = require("discord.js");

const { formatDuration } = require("../../utils/formats");

module.exports = {
    name: "seek",
    category: "Track",
    description: "Seeks to a certain point in the current playing track",
    options: [
        {
            name: "time",
            description: "Enter a number",
            required: true,
            type: "NUMBER"
        }
    ],

    /**
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     * @param {CommandInteractionOptionResolver} args 
     */
    async execute(client, interaction, args) {
        const serverQueue = client.queues.get(interaction.guild.id);
        const voiceChannel = interaction.member.voice.channel;

        const botPermissionsFor = interaction.channel.permissionsFor(interaction.guild.me);
        if (!botPermissionsFor.has(Permissions.FLAGS.USE_EXTERNAL_EMOJIS)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Use External Emojis in** " + "`" + interaction.channel.name + "`");

        if (!voiceChannel) return interaction.reply(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (!interaction.guild.me.voice.channel) return interaction.reply(client.emotes.error + " **I am not connected to a voice channel.** Type " + "`" + client.config.app.prefix + "join" + "`" + " to get me in one");

        if (interaction.guild.me.voice.channel && interaction.member.voice.channel.id !== interaction.guild.me.voice.channel.id) return interaction.reply(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");

        if (!serverQueue.tracks.length) return interaction.reply(client.emotes.error + " **Nothing playing in this server**, let's get this party started! :tada:");

        const time = args.getNumber("time") * 1000;

        if (serverQueue.tracks[0].isLive) return interaction.reply(client.emotes.error + " **Cannot seek a live song**");

        if (time > serverQueue.tracks[0].duration) return interaction.reply(client.emotes.error + "**Time cannot be longer than the song**");

        await serverQueue.play(serverQueue.tracks[0], time);
        interaction.reply(client.emotes.seek + " **Set position to** `" + formatDuration(time) + "`");
    }
}