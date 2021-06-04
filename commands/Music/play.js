module.exports = {
    name: "play",
    aliases: ["p"],
    category: "Track",
    description: "Plays a song with the given name or url.",
    utilisation: "{prefix}play <link/query>",

    async execute(client, message, args) {

        //Variables
        let voiceChannel = message.member.voice.channel;
        let textChannel = message.channel;

        const serverQueue = message.client.queue.get(message.guild.id);

        //Command Rules
        if (!voiceChannel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

        if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");

        if (!message.guild.me.voice.channel) if (!args[0]) return message.channel.send(client.emotes.error + " **Invalid usage:** " + "`" + client.config.discord.prefix + "play [Link or query]" + "`");

        if (!args[0]) {
            client.player.resume(message)
            return
        }

        //Command Permissions
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT")) return message.channel.send(client.emotes.error + " **I do not have permission to connect to** " + "`" + voiceChannel.name + "`")
        if (!permissions.has("SPEAK")) return message.channel.send(client.emotes.error + " **I do not have permission to speak in** " + "`" + voiceChannel.name + "`")


        //Link and search variables 
        var query = args.join(" ");
        var url = args[0] ? args[0].replace(/<(.+)>/g, "$1") : "";


        client.player.play(message, url, query)

    }
}