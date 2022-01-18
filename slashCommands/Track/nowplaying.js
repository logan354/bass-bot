const { Client, CommandInteraction, CommandInteractionOptionResolver, Permissions, MessageEmbed } = require("discord.js");

const { createProgressBar } = require("../../utils/progressBar");

module.exports = {
    name: "nowplaying",
    category: "Track",
    description: "Shows the current playing song",

    /**
     * @param {Client} client 
     * @param {CommandInteraction} interaction
     * @param {CommandInteractionOptionResolver} args 
     */
    execute(client, interaction, args) {
        const serverQueue = client.queues.get(interaction.guild.id);

        const botPermissionsFor = interaction.channel.permissionsFor(interaction.guild.me);
        if (!botPermissionsFor.has(Permissions.FLAGS.USE_EXTERNAL_EMOJIS)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Use External Emojis in** " + "`" + interaction.channel.name + "`");
        if (!botPermissionsFor.has(Permissions.FLAGS.EMBED_LINKS)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Embed Links in** " + "`" + interaction.channel.name + "`");

        if (!interaction.guild.me.voice.channel) return interaction.reply(client.emotes.error + " **I am not connected to a voice channel.** Type " + "`" + client.config.app.prefix + "join" + "`" + " to get me in one");

        if (!serverQueue.tracks.length) return interaction.reply(client.emotes.error + " **Nothing playing in this server**, let's get this party started! :tada:");

        const currentStreamTime = serverQueue.streamDispatcher.audioPlayer.state.playbackDuration + serverQueue.additionalStreamTime;

        const embed = new MessageEmbed()
            .setColor("BLACK")
            .setAuthor({
                name: "Now Playing",
                iconURL: client.emotes.player
            })
            .setDescription(`**[${serverQueue.tracks[0].title}](${serverQueue.tracks[0].url})**`)
            .setThumbnail(serverQueue.tracks[0].thumbnail)
            .setFields(
                {
                    name: "Time",
                    value: createProgressBar(currentStreamTime, serverQueue.tracks[0].duration, serverQueue.tracks[0].durationFormatted)
                },
                {
                    name: "Channel",
                    value: serverQueue.tracks[0].channel,
                    inline: true
                },
                {
                    name: "Song Duration",
                    value: "`" + serverQueue.tracks[0].durationFormatted + "`",
                    inline: true
                },
                // Empty for last field
                {
                    name: "\u200B",
                    value: "\u200B",
                    inline: true
                },

                {
                    name: "\u200B",
                    value: "**Requested by:** " + "<@" + serverQueue.tracks[0].requestedBy.id + ">"
                }
            );

        interaction.reply({ embeds: [embed] });
    }
}