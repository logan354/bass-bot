const { Client, Message, PermissionsBitField } = require("discord.js");
const MusicSubscription = require("../../structures/MusicSubscription");
const { RepeatMode } = require("../../utils/constants");

module.exports = {
    name: "repeat",
    aliases: ["loop"],
    category: "Music",
    description: "Toggles the repeat mode.",
    utilisation: "repeat",

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

        if (subscription.repeat === RepeatMode.OFF) {
            subscription.repeat = RepeatMode.QUEUE
            message.channel.send(client.emotes.repeat + " **Enabled**");
        } 
        else if (subscription.repeat === RepeatMode.QUEUE) {
            subscription.repeat = RepeatMode.TRACK
            return message.channel.send(client.emotes.repeatTrack + " **Enabled**");
        }
        else {
            subscription.repeat = RepeatMode.OFF
            return message.channel.send(client.emotes.repeat + " **Disabled**");
        }
    }
}