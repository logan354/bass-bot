const { Client, Message, PermissionsBitField } = require("discord.js");
const MusicSubscription = require("../../structures/MusicSubscription");

module.exports = {
    name: "join",
    aliases: ["summon"],
    category: "Music",
    description: "Connects the bot to the voice channel",
    utilisation: "join",

    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {string[]} args 
     */
    async execute(client, message, args) {
        /**
         * @type {MusicSubscription}
         */
        let subscription = client.subscriptions.get(message.guild.id);

        const botPermissionsFor = message.channel.permissionsFor(message.guild.members.me);
        if (!botPermissionsFor.has(PermissionsBitField.Flags.UseExternalEmojis)) return message.channel.send(client.emotes.permissionError + " **I do not have permission to Use External Emojis in** <#" + message.channel.id + ">");

        if (!message.member.voice.channel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (!subscription) {
            subscription = new MusicSubscription(client, message.guild.id, message.channel);
        }

        const botPermissionsForVoice = message.member.voice.channel.permissionsFor(message.guild.members.me);
        if (!botPermissionsForVoice.has(PermissionsBitField.Flags.Connect)) return message.channel.send(client.emotes.permissionError + " **I do not have permission to Connect in** <#" + message.member.voice.channel.id + ">");
        if (!botPermissionsForVoice.has(PermissionsBitField.Flags.Speak)) return message.channel.send(client.emotes.permissionError + " **I do not have permission to Speak in** <#" + message.member.voice.channel.id + "`");

        try {
            await subscription.connect(message.member.voice.channel);
        } catch {
            if (!subscription.connection) subscription.destroy();
            return message.channel.send(client.emotes.error + " **Error joining** <#" + message.member.voice.channel.id + ">");
        }

        message.channel.send(client.emotes.success + " **Joined <#" + message.member.voice.channel.id + "> and bound to** <#" + message.channel.id + ">");
    }
}