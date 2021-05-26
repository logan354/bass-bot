//formatTime function accepts only seconds
function formatTime(time) { 
    // Hours, minutes and seconds
    var hrs = ~~(time / 3600);
    var mins = ~~((time % 3600) / 60);
    var secs = ~~time % 60;

    // Output like "1:01" or "4:03:59" or "123:03:59"
    var ret = "";
    if (hrs > 0) {
        ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
    }
    ret += "" + mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs;
    return ret; 
} 



//resolveQueryType resolves which query the user input is
function resolveQueryType(url, query) {

    //Playlists
    if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) return "youtube-playlist"

    //if (url.match(/https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:playlist\/|\?uri=spotify:playlist:)((\w|-){22})/)) return "spotify-playlist"

    //if (url.match(/https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:album\/|\?uri=spotify:album:)((\w|-){22})/)) return "spotify-album"

    //Videos
    if (url.match(/^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi)) return "youtube-video"

    if (url.match(/^https?:\/\/(soundcloud\.com)\/(.*)$/gi)) return "soundcloud-song"

    if (url.match(/https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:track\/|\?uri=spotify:track:)((\w|-){22})/)) return "spotify-song"

    return "youtube-video-keywords"

}



//Splits queue into pages
class util {
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

                let loopEnabler = '❌';
                let loopQueueEnabler = '❌';
                if (queue.loop === true) loopEnabler = '✅';
                if (queue.loopQueue === true) loopQueueEnabler = '✅';

                var embed;
                if (currPage === 0) 
                embed = message.embeds[0].setDescription("__**Now Playing**__\n" + `[${queue.tracks[0].title}](${queue.tracks[0].url})\n` + "`" + queue.tracks[0].durationFormatted + "` **|** Requested by: <@" + queue.tracks[0].requestedBy + ">" + "\n\n__**Up Next**__\n" + contents[currPage])
                .setFooter('Page ' + (currPage + 1) + '/' + contents.length + ' | Loop: ' + loopEnabler + ' | Queue Loop: ' + loopQueueEnabler, author.displayAvatarURL());
                else { 
                    embed = message.embeds[0].setDescription(contents[currPage])
                    .setFooter('Page ' + (currPage + 1) + '/' + contents.length + ' | Loop: ' + loopEnabler + ' | Queue Loop: ' + loopQueueEnabler, author.displayAvatarURL()); 
                }

                message.edit(embed);

                this.pagination(message, author, contents, false, currPage);
            })
            .on("end", (_, reason) => {
                if (["time", "user"].includes(reason)) message.reactions.removeAll();
            });
    }
};



module.exports = { formatTime, resolveQueryType, util }