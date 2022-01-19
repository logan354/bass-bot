const { Client, CommandInteraction, CommandInteractionOptionResolver, Permissions } = require("discord.js");

module.exports = {
    name: "disconnect",
    category: "Track",
    description: "Disconnects Bass from the voice channel",

    /**
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     * @param {CommandInteractionOptionResolver} args 
     */
    execute(client, interaction, args) {
        const serverQueue = client.queues.get(interaction.guild.id);
        const voiceChannel = interaction.member.voice.channel;

        const botPermissionsFor = interaction.channel.permissionsFor(interaction.guild.me);
        if (!botPermissionsFor.has(Permissions.FLAGS.USE_EXTERNAL_EMOJIS)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Use External Emojis in** " + "`" + interaction.channel.name + "`");

        if (!interaction.guild.me.voice.channel) return interaction.reply(client.emotes.error + " **I am not connected to a voice channel.** Type " + "`" + client.config.app.prefix + "join" + "`" + " to get me in one");

        const voiceChannelSize = voiceChannel.members.filter(m => !m.user.bot).size;
        if (voiceChannelSize > 1 && !interaction.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) return interaction.reply(client.emotes.permissionError + " **This command requires you to have the Manage Channels permission to use it (being alone with the bot also works)**");

        serverQueue.destroy();
        interaction.reply(client.emotes.disconnect + " **Successfully disconnected**");
    }
}