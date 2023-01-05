const { Client, VoiceState } = require("discord.js");
const { State } = require("../utils/constants");

/**
 * @param {Client} client 
 * @param {VoiceState} oldState 
 * @param {VoiceState} newState 
 */
module.exports = async (client, oldState, newState) => {
    if (oldState.id === client.user.id) {
        const player = client.guildPlayers.get(oldState.guild.id);

        if (player) {
            if (oldState.channel && newState.channel && newState.channel.id !== oldState.channel.id) {
                // Bot has been forcefully moved to another channel
                if (player.state !== State.CONNECTING) {
                    await player.connect(newState.channel);
                }
            }
            else if (oldState.channel && !newState.channel) {
                // Bot has been forcefully disconnected
                // if (player.state !== State.DISCONNECTING) {
                //     player.destroy();
                // }
            }
        }
    }
}