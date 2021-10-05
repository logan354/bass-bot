module.exports = class Pagination {
    /**
     * Creates queue chunks
     * @param {Map} arr Queue map
     * @param {number} size Size of the chunks
     * @returns {Array}
     */
    static chunk(arr, size) {
        const temp = [];
        for (let i = 0; i < arr.length; i += size) {
            temp.push(arr.slice(i, i + size));
        }
        return temp;
    }

    /**
     * Gets emojis for pagination
     */
    static get paginationEmojis() {
        return ["◀", "⛔", "▶"];
    }

    /**
     * Creates queue pages
     * @param {object} message Discord.js message object
     * @param {object} author User from discord.js message object
     * @param {Array} contents Queue chunks
     * @param {boolean} init If init or not
     * @param {number} currPage Page user is on 
     */
    static async pagination(message, author, contents, init = true, currPage = 0) {
        if (init) for (const emoji of this.paginationEmojis) await message.react(emoji);

        const collector = message.createReactionCollector(
            (reaction, user) => {
                return this.paginationEmojis.includes(reaction.emoji.name) && user.id === author.id;
            },
            {
                max: 1,
                time: 60000,
            }
        );

        collector
            .on("collect", (reaction) => {
                reaction.users.remove(author);

                const emoji = reaction.emoji.name;
                if (emoji === this.paginationEmojis[0]) currPage--;
                if (emoji === this.paginationEmojis[1]) return collector.stop();
                if (emoji === this.paginationEmojis[2]) currPage++;
                currPage = ((currPage % contents.length) + contents.length) % contents.length;

                const serverQueue = message.client.queues.get(message.guild.id);

                let loopEnabler = "❌";
                let loopQueueEnabler = "❌";
                if (serverQueue.loop) loopEnabler = "✅";
                if (serverQueue.loopQueue) loopQueueEnabler = "✅";

                var embed;
                if (currPage === 0)
                    embed = message.embeds[0].setDescription("__**Now Playing**__\n" + `[${serverQueue.tracks[0].title}](${serverQueue.tracks[0].url})\n` + "`" + serverQueue.tracks[0].durationFormatted + "` **|** Requested by: <@" + serverQueue.tracks[0].requestedBy + ">" + "\n\n__**Up Next**__\n" + contents[currPage])
                        .setFooter("Page " + (currPage + 1) + "/" + contents.length + " | Loop: " + loopEnabler + " | Queue Loop: " + loopQueueEnabler, author.displayAvatarURL());
                else {
                    embed = message.embeds[0].setDescription(contents[currPage])
                        .setFooter("Page " + (currPage + 1) + "/" + contents.length + " | Loop: " + loopEnabler + " | Queue Loop: " + loopQueueEnabler, author.displayAvatarURL());
                }

                message.edit(embed);

                this.pagination(message, author, contents, false, currPage);
            })
            .on("end", (_, reason) => {
                if (["time", "user"].includes(reason)) message.reactions.removeAll();
            });
    }
}