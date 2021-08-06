module.exports = class Track {
    /**
     * Track constructer
     */
    constructor() {
        /**
         * Title of this track
         */
        this.title;

        /**
         * Url of this track
         */
        this.url;

        /**
         * Stream url of this track
         */
        this.streamURL;

        /**
         * Thumbnail of this track
         */
        this.thumbnail;

        /**
         * Duration of this track
         */
        this.duration;

        /**
         * Formated duration of this track      
         */
        this.durationFormatted;

        /**
         * Channel of this track
         */
        this.channel;

        /**
         * Views of this track
         */
        this.views;

        /**
         * Requester of this track
         */
        this.requestedBy;

        /**
         * If this track is from a playlist
         */
        this.isFromPlaylist;

        /**
         * If this track is live
         */
        this.isLive;

        /**
         * Source of this track
         */
        this.source;
    }
}