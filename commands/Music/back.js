const { Client, Message, PermissionsBitField } = require("discord.js");
const MusicSubscription = require("../../structures/MusicSubscription");

module.exports = {
    name: "back",
    aliases: ["previous"],
    category: "Music",
    description: "Backs to the previously played song (Voting System).",
    utilisation: "back",

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

        if (!subscription.previousQueue.length) return message.channel.send(client.emotes.error + " **Nothing is in the queue**, let's get this party started! :tada:");

        console.log(subscription.previousQueue)
        const previousTrack = subscription.previousQueue.splice(subscription.previousQueue.length - 1, 1);

        const voiceChannelSize = message.member.voice.channel.members.filter(m => !m.user.bot).size;

        if (voiceChannelSize > 2) {
            const requiredVotes = Math.trunc(voiceChannelSize * 0.75);

            if (subscription.metadata.voteSkipList.includes(message.author.id)) {
                return message.channel.send(client.emotes.error + " **You already voted to back to the previously played song** (" + subscription.metadata.voteSkipList.length + "/" + requiredVotes + " people)");
            }
            else serverQueue.skiplist.push(message.author.id);

            if (subscription.metadata.voteSkipList.length >= requiredVotes) {
                subscription.queue.splice(0, 0, ...previousTrack);
                subscription.queue.splice(1, 0, ...previousTrack);
                subscription.audioPlayer.stop();
                message.channel.send(client.emotes.skip + " **Backed**");
            }
            else message.channel.send("**Backed?** (" + subscription.metadata.voteSkipList.length + "/" + requiredVotes + " people)");
        }
        else {
            subscription.queue.splice(1, 0, ...previousTrack);
            subscription.audioPlayer.stop();
            message.channel.send(client.emotes.skip + " **Backed**");
        }
    }
}
