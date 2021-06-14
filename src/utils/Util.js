class Util {
    //formatTime function accepts only seconds
    static formatTime(time) {
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
    static resolveQueryType(url, query) {
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



    //Global emojis for music funtions
    static emojis = {
        //General emojis
        success: "<:Success:850228860117319700>",
        error: "<:Error:850228860162277426>",

        //Music emojis
        logo: "<:BassLogo:850649409334280202>",
        smallLogo: "<:BassSmallLogo:850228524736577576>",
        player: "https://media2.giphy.com/media/LwBTamVefKJxmYwDba/giphy.gif?cid=6c09b952a802c7s4bkq4n5kc0tcp1il42k0uqfoo4p0bx3xl&rid=giphy.gif",
        playerFrozen: "<:PlayerFrozen:844386375338819584>",
        youtube: "<:Youtube:844386374143967253>",
        soundcloud: "<:Soundcloud:844386374000836609>",
        spotify: "<:Spotify:844386374182633532>",

        //Function emojis
        disconnect: ":mailbox_with_no_mail:",
        resume: ":play_pause:",
        pause: ":pause_button:",
        skip: ":track_next:",
        loop: ":repeat_one:",
        loopQueue: ":repeat:",
        shuffle: ":twisted_rightwards_arrows:",

        //Util emojis
        cooldown: ":zzz:",
    }



    //Cooldown timer that is applied to functions that let the bot join the voice channel or that interfere with the music playing
    static cooldown(message) {
        //Variables
        let voiceChannel = message.member.voice.channel;
        let textChannel = message.channel;

        const serverQueue = message.client.queue.get(message.guild.id);

        const serverCooldown = message.client.cooldownTimeout.get(message.guild.id);

        if (serverCooldown) {
            clearTimeout(serverCooldown);
            message.client.cooldownTimeout.delete(message.guild.id);
        }

        if (message.guild.me.voice.channel) {
            var timeout = setTimeout(async function () {
                if (voiceChannel.members.filter(m => !m.user.bot).size === 0 || serverQueue.tracks.length === 0 || serverQueue.playing === false) {
                    try {
                        message.client.queue.delete(message.guild.id);
                        await voiceChannel.leave();
                        message.channel.send(Util.emojis.cooldown + " **Left the voice channel due to inactivity**")
                    }
                    catch (ex) {
                        console.log(ex)
                    }
                }
            }, 600000) //10 minutes

            message.client.cooldownTimeout.set(message.guild.id, timeout)

        }
    }
}

module.exports = { Util }