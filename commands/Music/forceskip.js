const { Client, Message, PermissionsBitField } = require("discord.js");
const MusicSubscription = require("../../structures/MusicSubscription");

module.exports = {
    name: "forceskip",
    aliases: ["fs"],
    category: "Music",
    description: "Force skips the currently playing song.",
    utilisation: "forceskip [number]",

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

        if (!subscription.queue.length) return message.channel.send(client.emotes.error + " **Nothing is in the queue**, let's get this party started! :tada:");

        if (!args[0]) {
            subscription.next();
            return message.channel.send(client.emotes.skip + " **Skipped**");
        }

        let jumpNum = Number(args[0]);

        if (!jumpNum) return message.channel.send(client.emotes.error + " **Value must be a number**");

        if (jumpNum <= 0) return message.channel.send(client.emotes.error + " **Value must be a number greater than 1**");

        if (jumpNum > subscription.queue.length) jumpNum = subscription.queue.length;


        if (jumpNum === 1 || subscription.queue.length === 1) {
            subscription.next();
            message.channel.send(client.emotes.skip + " **Skipped**");
        }
        else {
            subscription.next(jumpNum);
            message.channel.send(client.emotes.skip + " **Skipped " + jumpNum + " songs**");
        }
    }
}