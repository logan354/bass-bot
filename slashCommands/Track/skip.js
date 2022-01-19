const { Client, CommandInteraction, CommandInteractionOptionResolver, Permissions } = require("discord.js");

module.exports = {
    name: "skip",
    category: "Track",
    description: "Votes to skip the currently playing song.",

    /**
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     * @param {CommandInteractionOptionResolver} args 
     */
    execute(client, interaction, args) {
        const serverQueue = client.queues.get(interaction.guild.id);
        const voiceChannel = interaction.member.voice.channel;
        const activationNum = 2;

        const botPermissionsFor = interaction.channel.permissionsFor(interaction.guild.me);
        if (!botPermissionsFor.has(Permissions.FLAGS.USE_EXTERNAL_EMOJIS)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Use External Emojis in** " + "`" + interaction.channel.name + "`");

        if (!voiceChannel) return interaction.reply(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (!interaction.guild.me.voice.channel) return interaction.reply(client.emotes.error + " **I am not connected to a voice channel.** Type " + "`" + client.config.app.prefix + "join" + "`" + " to get me in one");

        if (interaction.guild.me.voice.channel && interaction.member.voice.channel.id !== interaction.guild.me.voice.channel.id) return interaction.reply(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");

        if (!serverQueue.tracks.length) return interaction.reply(client.emotes.error + " **Nothing playing in this server**, let's get this party started! :tada:");

        // Gets the amount of users in the voice channel (except bots)
        const voiceChannelSize = voiceChannel.members.filter(m => !m.user.bot).size;

        if (voiceChannelSize > activationNum) {
            const requiredVotes = Math.trunc(voiceChannelSize * 0.75);

            if (serverQueue.skiplist.includes(interaction.author.id)) {
                return interaction.reply(client.emotes.error + " **You already voted to skip the current song** (" + serverQueue.skiplist.length + "/" + requiredVotes + " people)");
            }
            else serverQueue.skiplist.push(interaction.author.id);

            if (serverQueue.skiplist.length >= requiredVotes) {
                serverQueue.streamDispatcher.audioPlayer.stop();
                interaction.reply(client.emotes.skip + " **Skipped**");
            } else interaction.reply("**Skipping?** (" + serverQueue.skiplist.length + "/" + requiredVotes + " people)");
        }
        else {
            serverQueue.streamDispatcher.audioPlayer.stop();
            interaction.reply(client.emotes.skip + " **Skipped**");
        }
    }
}