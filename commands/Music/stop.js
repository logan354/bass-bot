const { Client, Message, PermissionsBitField } = require("discord.js");
const MusicSubscription = require("../../structures/MusicSubscription");

module.exports = {
    name: "stop",
    aliases: [],
    category: "Music",
    description: "Stops the player and clear the queue",
    utilisation: "stop",

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

        const voiceChannelSize = message.member.voice.channel.members.filter(m => !m.user.bot).size;
        if (voiceChannelSize > 1 && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return message.channel.send(client.emotes.permissionError + " **This command requires you to have the Manage Channels permission to use it (being alone with the bot also works)**");

        if (!subscription.isPlaying()) return message.channel.send(client.emotes.error + " **The player is not playing**");

        subscription.audioPlayer.stop();
        subscription.queue = [];
        subscription.previousQueue = [];
        message.channel.send(client.emotes.stop + " **Stopped**");
    }
}