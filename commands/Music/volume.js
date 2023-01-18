const { Client, Message, PermissionsBitField } = require("discord.js");
const MusicSubscription = require("../../structures/MusicSubscription");

module.exports = {
    name: "volume",
    aliases: ["vol"],
    category: "Music",
    description: "Display or change the volume of the player.",
    utilisation: "volume [number (1-200)]",

    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {string[]} args 
     */
    execute(client, message, args) {
        /**
         * @type {MusicSubscription}
         */
        const subscription = client.subscriptions.get(message.guild.id);

        const botPermissionsFor = message.channel.permissionsFor(message.guild.members.me);
        if (!botPermissionsFor.has(PermissionsBitField.Flags.UseExternalEmojis)) return message.channel.send(client.emotes.permissionError + " **I do not have permission to Use External Emojis in** <#" + message.channel.id + ">");

        if (!message.member.voice.channel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (!subscription || !subscription.connection) return message.channel.send(client.emotes.error + " **I am not connected to a voice channel.**");

        if (subscription && subscription.connection && message.member.voice.channel.id !== subscription.voiceChannel.id) return message.channel.send(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");

        if (!args[0]) return message.channel.send(client.emotes.volume + " **Volume level is currently " + subscription.volume + "%**");

        const volume = Number(args[0]);

        if (!volume) return message.channel.send(client.emotes.error + " **Volume must be a number**");

        if (volume < 0 || volume > 200) return message.channel.send(client.emotes.error + " **Volume must be a number between 1 - 200**");

        let volumeEmoji;
        if (subscription.volume > volume) volumeEmoji = client.emotes.volumeDown;
        else volumeEmoji = client.emotes.volumeUp;

        subscription.volume = volume;
        if (subscription.isPlaying()) {
            subscription.audioPlayer.state.resource.volume.setVolumeLogarithmic(subscription.volume / 100);
        }

        message.channel.send(volumeEmoji + " **Volume level is now set to " + subscription.volume + "%**");
    }
}