const { Client } = require("discord.js");
const MusicSubscription = require("../structures/MusicSubscription");

/**
 * @param {Client} client 
 * @param {import("discord.js").Interaction} interaction 
 */
module.exports = async (client, interaction) => {
    /**
 * @type {MusicSubscription}
 */
    const subscription = client.subscriptions.get(interaction.guild.id);

    await interaction.deferReply();

    if (!subscription.isPaused()) {
        subscription.pause();
        interaction.editReply(client.emotes.pause + " **Paused**");
    }
    else {
        subscription.resume();
        interaction.editReply(client.emotes.resume + " **Resumed**");
    }
}