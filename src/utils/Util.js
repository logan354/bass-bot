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



    static emojis = {
        //General emojis
        success: "<:Success:850228860117319700>",
        error: "<:Error:850228860162277426>",

        //Music emojis
        logo: "<:Logo:850649409334280202>",
        smallLogo: "<:SmallLogo:850228524736577576>",
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
    }
}

module.exports = { Util }