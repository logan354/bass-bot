module.exports = class Playlist {
    /**
     * Playlist constructer
     */
    constructor() {
        /**
         * Title of this playlist
         */
        this.title;

        /**
         * Url of this playlist
         */
        this.url;

        /**
         * Thumbnail of this playlist
         */
        this.thumbnail;

        /**
         * Tracks of this playlist
         */
        this.tracks;

        /**
         * Duration of this playlist
         */
        this.duration;

        /**
         * Formated duration of this playlist     
         */
        this.durationFormatted;

        /**
         * Channel of this playlist
         */
        this.channel;

        /**
         * Requester of this playlist
         */
        this.requestedBy;

        /**
         * Source of this playlist
         */
        this.source;
    }
}