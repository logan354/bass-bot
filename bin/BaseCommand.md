# Base Command Structure

1. Global variables.
2. Command boundary's: Permissions, User boundary's, Client boundary's
3. The executable command itself.

```js
const player = client.guildPlayers.get(message.guild.id);
const voiceChannel = message.member.voice.channel;

const botPermissionsFor = message.channel.permissionsFor(message.guild.me);
if (!botPermissionsFor.has(PermissionsBitField.Flags.UseExternalEmojis)) return message.channel.send(client.emotes.permissionError + " **I do not have permission to Use External Emojis in** <#" + message.channel.id + ">");

if (!voiceChannel) return message.channel.send(client.emotes.error + " **You have to be in a voice channel to use this command**");

if (!player || !message.guild.members.me.voice.channel) return message.channel.send(client.emotes.error + " **I am not connected to a voice channel**");

if (message.guild.members.me.voice.channel && message.member.voice.channel.id !== message.guild.members.me.voice.channel.id) return message.channel.send(client.emotes.error + " **You need to be in the same voice channel as Bass to use this command**");

if (!player.queue.length) return message.channel.send(client.emotes.error + " **Nothing playing in this server**, let's get this party started! :tada:");
```