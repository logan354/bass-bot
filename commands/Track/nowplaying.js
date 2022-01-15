const { Client, Message, MessageEmbed } = require("discord.js");

const { createProgressBar } = require("../../utils/progressBar");

module.exports = {
    name: "nowplaying",
    aliases: ["np"],
    category: "Track",
    description: "Shows the current playing song",
    utilisation: "{prefix}nowplaying",
    
    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {string[]} args 
     */
    execute(client, message, args) {
        const serverQueue = client.queues.get(message.guild.id);

        if (!message.guild.me.voice.channel) return message.channel.send(client.emotes.error + " **I am not connected to a voice channel.** Type " + "`" + client.config.app.prefix + "join" + "`" + " to get me in one");

        if (!serverQueue.tracks.length) return message.channel.send(client.emotes.error + " **Nothing playing in this server**, let's get this party started! :tada:");

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

        message.channel.send({ embeds: [embed] });
    }
}