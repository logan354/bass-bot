const { Client, CommandInteraction, CommandInteractionOptionResolver, PermissionsBitField } = require("discord.js");
const MusicSubscription = require("../../structures/MusicSubscription");
const { RepeatMode } = require("../../utils/constants");

module.exports = {
    name: "repeat",
    category: "Music",
    description: "Toggles the repeat mode.",
    utilisation: "repeat",

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


        if (subscription.queue.repeat === RepeatMode.OFF) {
            subscription.queue.repeat = RepeatMode.QUEUE
            interaction.reply(client.emotes.repeat + " **Enabled**");
        }
        else if (subscription.queue.repeat === RepeatMode.QUEUE) {
            subscription.queue.repeat = RepeatMode.TRACK
            interaction.reply(client.emotes.repeatSong + " **Enabled**");
        }
        else {
            subscription.queue.repeat = RepeatMode.OFF
            interaction.reply(client.emotes.repeat + " **Disabled**");
        }
    }
}