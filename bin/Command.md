# Command Structure

1. Global variables, e.g serverQueue, voiceChannel.
2. Command boundarys, requirements the user must meet to execute the command.
3. Other, message the user may need to know.
4. The executable command itself.

```js
const serverQueue = client.queues.get(message.guild.id);
const voiceChannel = message.member.voice.channel;

if (!voiceChannel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

if (!message.guild.me.voice.channel) return message.channel.send(client.emotes.error + " **I am not connected to a voice channel.** Type " + "`" + client.config.app.prefix + "join" + "`" + " to get me in one");

if (message.guild.me.voice.channel && message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");

if (!serverQueue.tracks.length) return message.channel.send(client.emotes.error + " **Nothing playing in this server**, let's get this party started! :tada:");

if (!args[0]) return message.channel.send(client.emotes.error + " **Invalid input:** `" + this.utilisation.replace("{prefix}", client.config.app.prefix) + "`");


message.channel.send(":construction_site: **Command still under construction**");
```