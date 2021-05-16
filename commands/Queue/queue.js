const { MessageEmbed } = require("discord.js");
const { util, formatTime } = require('../../src/structures/Util');

module.exports = {
    name: 'queue',
    aliases: ['q'],
    category: 'Queue',
    utilisation: '{prefix}queue <page>',

    async execute(client, message, args) {

        //Variables
        let voiceChannel = message.member.voice.channel;
        let textChannel = message.channel;

        const queue = message.client.queue.get(message.guild.id);

        //Command Rules
        if (!message.guild.me.voice.channel) return message.channel.send(`:x: - **I am not connected to a voice channel.** Type ` + '`' + client.config.discord.prefix + 'join' + '`' + ' to get me in one');

        if (!queue) return message.channel.send(`:x: - **Nothing playing in this server**, let's get this party started! :tada:`);


        //Command Permissions
        const permissions = message.channel.permissionsFor(message.client.user);
        if (!permissions.has('MANAGE_MESSAGES')) return message.channel.send(':x: - **I do not have permission to Manage Messages in ** ' + '`' + message.channel.name + '`');
        if (!permissions.has('ADD_REACTIONS')) return message.channel.send(':x: - **I do not have permission to Add Reactions in ** ' + '`' + message.channel.name + '`');


        //const que = queue.tracks.map((track, i) => `\`${i}.\` | [\`${track.title}\`](${track.url}) - ${track.requestedBy}`).slice(1, queue.tracks.length);

        const que = queue.tracks.map((track, i) => '`' + i + '.` ' + `[${track.title}](${track.url})\n` + '`' + track.durationFormatted + '` **|** Requested by: <@' + track.requestedBy + '>').slice(1, queue.tracks.length)

        const chunked = util.chunk(que, 5).map((x) => x.join("\n\n"));

        let pageNo = chunked.length;
        if (pageNo === 0) pageNo = 1;

        let totalTime = formatTime((queue.totalTime - queue.tracks[0].duration)) //Input must be seconds

        let loopEnabler = '❌';
        let loopQueueEnabler = '❌';
        if (queue.loop === true) loopEnabler = '✅';
        if (queue.loopQueue === true) loopQueueEnabler = '✅';


        if (queue.tracks.length === 1) {
            const embed = new MessageEmbed()
                .setAuthor('Queue for ' + message.guild.name, "https://media2.giphy.com/media/LwBTamVefKJxmYwDba/giphy.gif?cid=6c09b952a802c7s4bkq4n5kc0tcp1il42k0uqfoo4p0bx3xl&rid=giphy.gif")
                .setColor('BLACK')
                .setDescription('__**Now Playing**__\n' + `[${queue.tracks[0].title}](${queue.tracks[0].url})\n` + '`' + queue.tracks[0].durationFormatted + '` **|** Requested by: <@' + queue.tracks[0].requestedBy + '>')
                .addField('Voice Channel', queue.voiceChannel, true)
                .setFooter('Page 1/' + pageNo + ' | Loop: ' + loopEnabler + ' | Queue Loop: ' + loopQueueEnabler, message.author.displayAvatarURL());
            message.channel.send(embed)
        }

        else {
            const embed = new MessageEmbed()
                .setAuthor('Queue for ' + message.guild.name, "https://media2.giphy.com/media/LwBTamVefKJxmYwDba/giphy.gif?cid=6c09b952a802c7s4bkq4n5kc0tcp1il42k0uqfoo4p0bx3xl&rid=giphy.gif")
                .setColor('BLACK')
                .setDescription('__**Now Playing**__\n' + `[${queue.tracks[0].title}](${queue.tracks[0].url})\n` + '`' + queue.tracks[0].durationFormatted + '` **|** Requested by: <@' + queue.tracks[0].requestedBy + '>' + '\n\n__**Up Next**__\n' + chunked[0])
                .addField('Total songs:', '`' + (queue.tracks.length - 1) + '`', true)
                .addField('Total Length:', '`' + totalTime + '`', true)
                .addField('Voice Channel', queue.voiceChannel, true)
                .setFooter('Page 1/' + pageNo + ' | Loop: ' + loopEnabler + ' | Queue Loop: ' + loopQueueEnabler, message.author.displayAvatarURL());


            try {
                const queueMsg = await message.channel.send(embed);
                if (chunked.length > 1) await util.pagination(queueMsg, message.author, chunked);
            } catch (ex) {
                console.log(ex)
                message.channel.send(`:x: - **Error: Displaying queue: Status code: ERR_QUEUE**`);
            }
        }
    }
}

