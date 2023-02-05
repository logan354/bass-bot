const { ApplicationCommandOptionType, Client, CommandInteraction, CommandInteractionOptionResolver, PermissionsBitField } = require("discord.js");
const MusicSubscription = require("../../structures/MusicSubscription");
const { formatDuration, parseDuration } = require("../../utils/formatters");

module.exports = {
    name: "scrub",
    category: "Music",
    description: "Scrubs to a certain position on the current playing song.",
    utilisation: "scrub <time>",
    options: [
        {
            name: "time",
            description: "Enter a number or time format",
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],

    /**
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     * @param {CommandInteractionOptionResolver} args 
     */
    async execute(client, interaction, args) {
        /**
         * @type {MusicSubscription}
         */
        const subscription = client.subscriptions.get(interaction.guild.id);

        const botPermissionsFor = interaction.channel.permissionsFor(interaction.guild.members.me);
        if (!botPermissionsFor.has(PermissionsBitField.Flags.UseExternalEmojis)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Use External Emojis in** <#" + interaction.channel.id + ">");


        if (!interaction.member.voice.channel) return interaction.reply(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (!subscription || !subscription.connection) return interaction.reply(client.emotes.error + " **I am not connected to a voice channel.**");

        if (subscription && subscription.connection && interaction.member.voice.channel.id !== subscription.voiceChannel.id) return interaction.reply(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");

        if (!subscription.isPlaying()) return interaction.reply(client.emotes.error + " **The player is not playing**");


        const currentPlaybackDuration = subscription.audioPlayer.state.playbackDuration + subscription._additionalPlaybackDuration;

        let time = args.getString("time");

        if (Number(time) || Number(time) === 0) {
            time = time * 1000;
        }
        else {
            // Returns time in milliseconds
            time = parseDuration(time);

            if (time === 0) return interaction.reply(client.emotes.error + " **Error invalid format.** Example formats: `5:30`, `45s`, `1h24m`");
        }

        if (subscription.queue[0].isLive) return interaction.reply(client.emotes.error + " **Cannot scrub a live song**");

        if (time < 0 || time > subscription.queue[0].duration) return interaction.reply(client.emotes.error + " **Time must be in the range of the song**");

        let scrubEmoji;
        if (time > currentPlaybackDuration) scrubEmoji = client.emotes.fastforward;
        else scrubEmoji = client.emotes.rewind;

        await subscription.play(subscription.queue[0], { scrub: time });
        interaction.reply(scrubEmoji + " **Scrubbed to** `" + formatDuration(time) + "`");
    }
}