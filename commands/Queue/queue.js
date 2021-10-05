const { MessageEmbed } = require("discord.js");
const { formatDuration } = require("../../utils/Formatting");
const Pagination = require("../../utils/Pagination");

module.exports = {
    name: "queue",
    aliases: ["q"],
    category: "Queue",
    description: "Shows the first page of the queue.",
    utilisation: "{prefix}queue <page>",

    async execute(client, message, args) {
        const queue = client.queues.get(message.guild.id);

        if (!message.guild.me.voice.channel) return message.channel.send(client.emotes.error + " **I am not connected to a voice channel.** Type " + "`" + client.config.app.prefix + "join" + "`" + " to get me in one");

        if (!queue.tracks.length) return message.channel.send(client.emotes.error + " **Nothing playing in this server**, let's get this party started! :tada:");

        const permissions = message.channel.permissionsFor(message.client.user);
        if (!permissions.has("EMBED_LINKS")) return message.channel.send(client.emotes.error + " **I do not have permission to Manage Messages in ** " + "`" + message.channel.name + "`");
        if (!permissions.has("ADD_REACTIONS")) return message.channel.send(client.emotes.error + " **I do not have permission to Add Reactions in ** " + "`" + message.channel.name + "`");
        if (!permissions.has("MANAGE_MESSAGES")) return message.channel.send(client.emotes.error + " **I do not have permission to Manage Messages in ** " + "`" + message.channel.name + "`");

        const que = queue.tracks.map((track, i) => "`" + i + ".` " + `[${track.title}](${track.url})\n` + "`" + track.durationFormatted + "` **|** Requested by: <@" + track.requestedBy + ">").slice(1, queue.tracks.length);
        const chunked = Pagination.chunk(que, 5).map((x) => x.join("\n\n"));

        let pageNo = chunked.length;
        let loopEnabler = "❌";
        let loopQueueEnabler = "❌";
        
        if (pageNo === 0) pageNo = 1;
        if (queue.loop === true) loopEnabler = "✅";
        if (queue.loopQueue === true) loopQueueEnabler = "✅";

        //Printing the queue
        if (queue.tracks.length === 1) {
            const embed = new MessageEmbed()
                .setAuthor("Queue for " + message.guild.name, client.emotes.player)
                .setColor("BLACK")
                .setDescription("__**Now Playing**__\n" + `[${queue.tracks[0].title}](${queue.tracks[0].url})\n` + "`" + queue.tracks[0].durationFormatted + "` **|** Requested by: <@" + queue.tracks[0].requestedBy + ">")
                .addField("Voice Channel", message.guild.me.voice.channel, true)
                .setFooter("Page 1/" + pageNo + " | Loop: " + loopEnabler + " | Queue Loop: " + loopQueueEnabler, message.author.displayAvatarURL());
            message.channel.send(embed);
        } else {
            const embed = new MessageEmbed()
                .setAuthor("Queue for " + message.guild.name, client.emotes.player)
                .setColor("BLACK")
                .setDescription("__**Now Playing**__\n" + `[${queue.tracks[0].title}](${queue.tracks[0].url})\n` + "`" + queue.tracks[0].durationFormatted + "` **|** Requested by: <@" + queue.tracks[0].requestedBy + ">" + "\n\n__**Up Next**__\n" + chunked[0])
                .addField("Total songs:", "`" + (queue.tracks.length - 1) + "`", true)
                .addField("Total Length:", "`" + formatDuration(queue.duration() - queue.tracks[0].duration) + "`", true)
                .addField("Voice Channel", message.guild.me.voice.channel, true)
                .setFooter("Page 1/" + pageNo + " | Loop: " + loopEnabler + " | Queue Loop: " + loopQueueEnabler, message.author.displayAvatarURL());

            try {
                const queueMsg = await message.channel.send(embed);
                if (chunked.length > 1) await Pagination.pagination(queueMsg, message.author, chunked);
            } catch (ex) {
                console.log(ex);
                message.channel.send(client.emotes.error + " **Error:** `Displaying`");
            }
        }
    }
}

