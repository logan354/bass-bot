const { createProgressBar } = require("../../utils/ProgressBar");

module.exports = {
    name: "nowplaying",
    aliases: ["np"],
    category: "Track",
    description: "Shows what song Rythm is currently playing.",
    utilisation: "{prefix}nowplaying",

    execute(client, message, args) {

        const queue = client.queues.get(message.guild.id);

        if (!message.guild.me.voice.channel) return message.channel.send(client.emotes.error + " **I am not connected to a voice channel.** Type " + "`" + client.config.discord.prefix + "join" + "`" + " to get me in one");

        if (!queue.tracks.length) return message.channel.send(client.emotes.error + " **Nothing playing in this server**, let's get this party started! :tada:");

        const permissions = message.channel.permissionsFor(message.client.user);
        if (!permissions.has("MANAGE_MESSAGES")) return message.channel.send(client.emotes.error + " **I do not have permission to Manage Messages in ** " + "`" + message.channel.name + "`");
        if (!permissions.has("ADD_REACTIONS")) return message.channel.send(client.emotes.error + " **I do not have permission to Add Reactions in ** " + "`" + message.channel.name + "`");

        message.channel.send({
            embed: {
                color: "BLACK",
                author: {
                    name: "Now Playing",
                    icon_url: client.emotes.player,
                },
                description: `**[${queue.tracks[0].title}](${queue.tracks[0].url})**`,
                thumbnail: { url: queue.tracks[0].thumbnail },
                fields: [
                    { name: "\u200B", value: createProgressBar(message) },
                    
                    { name: "Channel", value: queue.tracks[0].channel, inline: true },
                    { name: "Song Duration", value: queue.tracks[0].durationFormatted, inline: true },
                    { name: "Views", value: queue.tracks[0].views, inline: true },

                    { name: "\u200B", value: "**Requested by:** " + "<@" + queue.tracks[0].requestedBy.id + ">" }
                ],
            },
        })
    }
}