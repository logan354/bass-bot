module.exports = {
    name: "join",
    aliases: ["summon"],
    category: "Track",
    description: "Summons the bot to the voice channel you are in.",
    utilisation: "{prefix}join",

    async execute(client, message, args) {

        //Variables
        let voiceChannel = message.member.voice.channel;
        let textChannel = message.channel;

        const serverQueue = message.client.queue.get(message.guild.id);

        //Command Rules
        if (!voiceChannel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");


        //Command Permissions
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT")) return message.channel.send(client.emotes.error + " **I do not have permission to connect to** " + "`" + voiceChannel.name + "`")
        if (!permissions.has("SPEAK")) return message.channel.send(client.emotes.error + " **I do not have permission to speak in** " + "`" + voiceChannel.name + "`")


        client.player.join(message);

    }
}


