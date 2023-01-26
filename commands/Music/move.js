const { Client, Message, PermissionsBitField } = require("discord.js");
const MusicSubscription = require("../../structures/MusicSubscription");

module.exports = {
    name: "move",
    aliases: [],
    category: "Music",
    description: "Moves a song in the queue.",
    utilisation: "move <index> <position>",

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


        if (!args[0] || !args[1]) return message.channel.send(client.emotes.error + " **Two positions are required**");


        if (!message.member.voice.channel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (!subscription || !subscription.connection) return message.channel.send(client.emotes.error + " **I am not connected to a voice channel.**");

        if (subscription && subscription.connection && message.member.voice.channel.id !== subscription.voiceChannel.id) return message.channel.send(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");

        const voiceChannelSize = message.member.voice.channel.members.filter(m => !m.user.bot).size;
        if (voiceChannelSize > 1 && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return message.channel.send(client.emotes.permissionError + " **This command requires you to have the Manage Channels permission to use it (being alone with the bot also works)**");

        if (!subscription.queue.length) return message.channel.send(client.emotes.error + " **Nothing is in the queue**, let's get this party started! :tada:");


        let position1 = Number(args[0]);
        let position2 = Number(args[1]);

        if (!position1 || !position2) return message.channel.send(client.emotes.error + " **Values must be a number**");

        if (position1 < 1 || position1 > subscription.queue.length - 1) return message.channel.send(client.emotes.error + " **Position 1 must be a number between 1 and " + (subscription.queue.length - 1).toString() + "**");

        if (position2 > subscription.queue.length - 1) position2 = subscription.queue.length - 1

        subscription.queue.move(position1, position2);
        message.channel.send(client.emotes.move + " **Moved **`" + subscription.queue[position2].name + "`** from position **`" + position1 + "`** to **`" + position2 + "`");
    }
}