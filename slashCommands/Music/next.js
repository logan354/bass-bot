const { Client, CommandInteraction, CommandInteractionOptionResolver, PermissionsBitField } = require("discord.js");
const MusicSubscription = require("../../structures/MusicSubscription");

module.exports = {
    name: "next",
    category: "Music",
    description: "Skips to the next song (Voting System).",
    utilisation: "next",

    /**
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     * @param {CommandInteractionOptionResolver} args 
     */
    execute(client, interaction, args) {
        /**
         * @type {MusicSubscription}
         */
        const subscription = client.subscriptions.get(interaction.guild.id);

        const botPermissionsFor = interaction.channel.permissionsFor(interaction.guild.members.me);
        if (!botPermissionsFor.has(PermissionsBitField.Flags.UseExternalEmojis)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Use External Emojis in** <#" + interaction.channel.id + ">");


        if (!interaction.member.voice.channel) return interaction.reply(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (!subscription || !subscription.connection) return interaction.reply(client.emotes.error + " **I am not connected to a voice channel.**");

        if (subscription && subscription.connection && interaction.member.voice.channel.id !== subscription.voiceChannel.id) return interaction.reply(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");

        if (!subscription.queue.length) return interaction.reply(client.emotes.error + " **Nothing is in the queue**, let's get this party started! :tada:");


        const voiceChannelSize = interaction.member.voice.channel.members.filter(m => !m.user.bot).size;

        if (voiceChannelSize > 2) {
            const requiredVotes = Math.trunc(voiceChannelSize * 0.75);

            if (subscription.metadata.voteSkipList.includes(interaction.user.id)) {
                return interaction.reply(client.emotes.error + " **You already voted to skip to the next song** (" + subscription.metadata.voteSkipList.length + "/" + requiredVotes + " people)");
            }
            else subscription.metadata.voteSkipList.push(interaction.user.id);

            if (subscription.metadata.voteSkipList.length >= requiredVotes) {
                subscription.next();
                interaction.reply(client.emotes.next + " **Next**");
            }
            else interaction.reply("**Skip to the next song?** (" + subscription.metadata.voteSkipList.length + "/" + requiredVotes + " people)");
        }
        else {
            subscription.next();
            interaction.reply(client.emotes.next + " **Next**");
        }
    }
}
