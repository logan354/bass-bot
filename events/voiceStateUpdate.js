const { Client, VoiceState } = require("discord.js");
const MusicSubscription = require("../structures/MusicSubscription");

/**
 * @param {Client} client 
 * @param {VoiceState} oldState 
 * @param {VoiceState} newState 
 */
module.exports = async (client, oldState, newState) => {
    if (oldState.id === client.user.id) {
        /**
         * @type {MusicSubscription}
         */
        const subscription = client.subscriptions.get(oldState.guild.id);

        if (subscription) {
            if (oldState.channel && newState.channel && newState.channel.id !== oldState.channel.id) {
                // Bot has been forcefully moved to another channel
                subscription.voiceChannel = newState.channel;
            }
            else if (oldState.channel && !newState.channel) {
                // Bot has been forcefully disconnected
            }
        }
    }
}