module.exports = async (client, oldState, newState) => {
    if (oldState && oldState.id === client.user.id && newState && newState.id === client.user.id) {
        const serverQueue = client.queues.get(newState.guild.id);

        if (serverQueue) {
            if (oldState.channel && oldState.channel.id === serverQueue.voiceChannel.id && !newState.channel) {
                // Bot has been disconnected forcefully
                //serverQueue.destroy();
            }

            if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
                // Bot has been moved from on channel to another forcefully
                await serverQueue.connect(newState.channel);
            }
        }
    }
}