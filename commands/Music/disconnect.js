const { Client, Message, PermissionsBitField } = require("discord.js");
const MusicSubscription = require("../../structures/MusicSubscription");

module.exports = {
    name: "disconnect",
    aliases: ["dc"],
    category: "Music",
    description: "Disconnects the bot from the voice channel",
    utilisation: "disconnect",

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

        if (!subscription || !subscription.connection) return message.channel.send(client.emotes.error + " **I am not connected to a voice channel.**");

        const voiceChannelSize = message.member.voice.channel.members.filter(m => !m.user.bot).size;
        if (voiceChannelSize > 1 && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return message.channel.send(client.emotes.permissionError + " **This command requires you to have the Manage Channels permission to use it (being alone with the bot also works)**");

        subscription.destroy();
        message.channel.send(client.emotes.disconnect + " **Disconnected**");
    }
}