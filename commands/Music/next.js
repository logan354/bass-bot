const { Client, Message, PermissionsBitField } = require("discord.js");
const MusicSubscription = require("../../structures/MusicSubscription");

module.exports = {
    name: "next",
    aliases: ["skip"],
    category: "Music",
    description: "Skips to the next song (Voting System).",
    utilisation: "next",

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

        if (!subscription.queue.length) return message.channel.send(client.emotes.error + " **Nothing is in the queue**, let's get this party started! :tada:");


        const voiceChannelSize = message.member.voice.channel.members.filter(m => !m.user.bot).size;

        if (voiceChannelSize > 2) {
            const requiredVotes = Math.trunc(voiceChannelSize * 0.75);

            if (subscription.metadata.voteSkipList.includes(message.author.id)) {
                return message.channel.send(client.emotes.error + " **You already voted to skip to the next song** (" + subscription.metadata.voteSkipList.length + "/" + requiredVotes + " people)");
            }
            else subscription.metadata.voteSkipList.push(message.author.id);

            if (subscription.metadata.voteSkipList.length >= requiredVotes) {
                subscription.next();
                message.channel.send(client.emotes.next + " **Next**");
            }
            else message.channel.send("**Skip to the next song?** (" + subscription.metadata.voteSkipList.length + "/" + requiredVotes + " people)");
        }
        else {
            subscription.next();
            message.channel.send(client.emotes.next + " **Next**");
        }
    }
}
