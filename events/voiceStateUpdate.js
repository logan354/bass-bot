const { handleEmptyCooldown } = require("../structures/Cooldowns");

module.exports = (client, oldState, newState) => {
    //User leaves the voice channel the bot is in
    if (oldState.channelID === oldState.guild.me.voice.channelID) handleEmptyCooldown(client, oldState);
}