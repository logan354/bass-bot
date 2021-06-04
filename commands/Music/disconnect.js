module.exports = {
    name: "disconnect",
    aliases: ["dc", "leave", "dis"],
    category: "Track",
    description: "Disconnects the bot from the voice channel it is in.",    
    utilisation: "{prefix}disconnect",

    async execute(client, message, args) {

        //Variables
        let voiceChannel = message.member.voice.channel;
        let textChannel = message.channel;

        const serverQueue = message.client.queue.get(message.guild.id);

        //Command Rules
        if (!message.guild.me.voice.channel) return message.channel.send(client.emotes.error + " **I am not connected to a voice channel.** Type " + "`" + client.config.discord.prefix + "join" + "`" + " to get me in one");


        client.player.disconnect(message);
        
    }
}