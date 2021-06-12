class Pagination {
    static chunk(arr, size) {
        const temp = [];
        for (let i = 0; i < arr.length; i += size) {
            temp.push(arr.slice(i, i + size));
        }
        return temp;
    }



    static get paginationEmojis() {
        return ["◀", "⛔", "▶"];
    }



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

                //Variables
                const queue = message.client.queue.get(message.guild.id);

                let loopEnabler = "❌";
                let loopQueueEnabler = "❌";
                if (queue.loop === true) loopEnabler = "✅";
                if (queue.loopQueue === true) loopQueueEnabler = "✅";

                var embed;
                if (currPage === 0)
                    embed = message.embeds[0].setDescription("__**Now Playing**__\n" + `[${queue.tracks[0].title}](${queue.tracks[0].url})\n` + "`" + queue.tracks[0].durationFormatted + "` **|** Requested by: <@" + queue.tracks[0].requestedBy + ">" + "\n\n__**Up Next**__\n" + contents[currPage])
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

module.exports = { Pagination }