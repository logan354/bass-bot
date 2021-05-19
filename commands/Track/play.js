const { play, resume } = require("../../src/Modules");

module.exports = {
    name: "play",
    aliases: ["p"],
    category: "Track",
    utilisation: "{prefix}play <link/query>",

    async execute(client, message, args) {

        //Variables
        let voiceChannel = message.member.voice.channel;
        let textChannel = message.channel;

        const serverQueue = message.client.queue.get(message.guild.id);

        //Command Rules
        if (!voiceChannel) return message.channel.send(":x: - **You have to be in a voice channel to use this command**");

        if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(":x: - **You need to be in the same voice channel as Bass to use this command**");

        if (!message.guild.me.voice.channel) if (!args[0]) return message.channel.send(":x: - **Invalid usage:** " + "`" + client.config.discord.prefix + "play [Link or query]" + "`");

        if (!args[0]) {
            resume(message)
            return
        }

        //Command Permissions
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT")) return message.channel.send(":x: - **I do not have permission to connect to** " + "`" + voiceChannel.name + "`")
        if (!permissions.has("SPEAK")) return message.channel.send(":x: - **I do not have permission to speak in** " + "`" + voiceChannel.name + "`")


        //Link and search variables 
        var query = args.join(" ");
        var url = args[0] ? args[0].replace(/<(.+)>/g, "$1") : "";


        play(message, url, query)

    }
}