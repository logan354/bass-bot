const { ApplicationCommandOptionType, Client, CommandInteraction, CommandInteractionOptionResolver, PermissionsBitField } = require("discord.js");
const MusicSubscription = require("../../structures/MusicSubscription");

module.exports = {
    name: "volume",
    category: "Music",
    description: "Display or changes the volume of the player.",
    utilisation: "volume [volume]",
    option: [
        {
            name: "volume",
            description: "Enter a number",
            type: ApplicationCommandOptionType.Number,
            required: false
        }
    ],

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

        if (!subscription.isPlaying()) return interaction.reply(client.emotes.error + " **The player is not playing**");


        if (!args.getNumber("volume")) return interaction.reply(client.emotes.volume + " **Volume level is currently " + subscription.volume + "%**");

        const volume = Number(args.getNumber("volume"));

        if (!volume && volume !== 0) return interaction.reply(client.emotes.error + " **Value must be a number**");

        if (volume < 0 || volume > 200) return interaction.reply(client.emotes.error + " **Volume must be a number, between 1 - 200**");

        let volumeEmoji;
        if (subscription.volume > volume) volumeEmoji = client.emotes.volumeDown;
        else volumeEmoji = client.emotes.volumeUp;

        subscription.volume = volume;
        subscription.audioPlayer.state.resource.volume.setVolumeLogarithmic(subscription.volume / 100);

        interaction.reply(volumeEmoji + " **Volume level is now set to " + subscription.volume + "%**");
    }
}