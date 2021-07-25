let voiceChannel = message.member.voice.channel;
let textChannel = message.channel;
let serverQueue = client.queues.get(message.guild.id);

if (!serverQueue) {
    serverQueue = new Queue(message);
    client.queues.set(message.guild.id, serverQueue);
}

try {
    const connection = await voiceChannel.join();
    serverQueue.connection = connection;
    connection.voice.setSelfDeaf(true);
    handleEndCooldown(message);
} catch (ex) {
    console.log(ex);
    return message.channel.send(client.emotes.error + " **Error: Joining:** `" + voiceChannel.name + "`");
}
message.channel.send(client.emotes.success + " **Successfully joined `" + voiceChannel.name + "` and bound to** <#" + textChannel.id + ">");