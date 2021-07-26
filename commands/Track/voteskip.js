module.exports = {
    name: "voteskip",
    aliases: ["skip", "next", "s"],
    category: "Track",
    description: "Votes to skip the current playing song.",
    utilisation: "{prefix}voteskip",

    execute(client, message, args) {
        let voiceChannel = message.member.voice.channel;
        const serverQueue = client.queues.get(message.guild.id);

        if (!voiceChannel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (!message.guild.me.voice.channel) return message.channel.send(client.emotes.error + " **I am not connected to a voice channel.** Type " + "`" + client.config.discord.prefix + "join" + "`" + " to get me in one");

        if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");
        
        if (!serverQueue.tracks.length) return message.channel.send(client.emotes.error + " **Nothing playing in this server**, let's get this party started! :tada:");

        const voiceChannelSize = voiceChannel.members.filter(m => !m.user.bot).size; //Gets the amount of users in the Voice Channel (execpt bots)

        if (voiceChannelSize > 2) { //Check if the amount of users in the Voice Channel is greater than 2
            const voteAmountDouble = voiceChannelSize * 0.75;
            const voteAmount = Math.trunc(voteAmountDouble);

            if (serverQueue.skiplist.includes(message.author.id)) { //If user has already voted then return
                return message.channel.send(client.emotes.error + " **You already voted to skip the current song** (" + serverQueue.skiplist.length + "/" + voteAmount + " people)");
            }

            serverQueue.skiplist.push(message.author.id); //Push the users ID to the skiplist

            if (serverQueue.skiplist.length >= voteAmount) { //If the skiplist.length >= voteAmount the skip the current track
                try {
                    serverQueue.connection.dispatcher.end();
                } catch (ex) {
                    console.log(ex);
                    return message.channel.send(client.emotes.error + " **Error:** `Skipping`");
                }
                message.channel.send(client.emotes.skip + " **Skipped**");
            }
            else return message.channel.send("**Skipping?** (" + serverQueue.skiplist.length + "/" + voteAmount + " people)"); //If the skiplist.length < voteAmount then return

        }

        else { //If the amount of users in the Voice Channel is less than 2 then skip the current track
            try {
                serverQueue.connection.dispatcher.end();
            } catch (ex) {
                console.log(ex);
                return message.channel.send(client.emotes.error + " **Error:** `Skipping`");
            }
            message.channel.send(client.emotes.skip + " **Skipped**");
        }
    }
}

