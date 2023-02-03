const { Client, CommandInteraction, CommandInteractionOptionResolver, PermissionsBitField } = require("discord.js");
const MusicSubscription = require("../../structures/MusicSubscription");

module.exports = {
    name: "join",
    category: "Music",
    description: "Connects the bot to your voice channel.",
    utilisation: "join",

    /**
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     * @param {CommandInteractionOptionResolver} args 
     */
    async execute(client, interaction, args) {
        /**
         * @type {MusicSubscription}
         */
        let subscription = client.subscriptions.get(interaction.guild.id);

        const botPermissionsFor = interaction.channel.permissionsFor(interaction.guild.members.me);
        if (!botPermissionsFor.has(PermissionsBitField.Flags.UseExternalEmojis)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Use External Emojis in** <#" + interaction.channel.id + ">");


        if (!interaction.member.voice.channel) return interaction.reply(client.emotes.error + " **You have to be in a voice channel to use this command**");


        if (!subscription) {
            subscription = new MusicSubscription(client, interaction.guild.id, interaction.channel);
        }

        const botPermissionsForVoice = interaction.member.voice.channel.permissionsFor(interaction.guild.members.me);
        if (!botPermissionsForVoice.has(PermissionsBitField.Flags.Connect)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Connect in** <#" + interaction.member.voice.channel.id + ">");
        if (!botPermissionsForVoice.has(PermissionsBitField.Flags.Speak)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Speak in** <#" + interaction.member.voice.channel.id + "`");

        interaction.deferReply();
        try {
            await subscription.connect(interaction.member.voice.channel);
        } catch {
            return interaction.editReply(client.emotes.error + " **Error connecting to** <#" + interaction.member.voice.channel.id + ">");
        }
        interaction.editReply(client.emotes.success + " **Connected to <#" + interaction.member.voice.channel.id + "> and bound to** <#" + interaction.channel.id + ">");
    }
}