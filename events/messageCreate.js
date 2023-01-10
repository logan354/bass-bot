const { Client, Message, ChannelType } = require("discord.js");

/**
 * @param {Client} client 
 * @param {Message} message 
 */
module.exports = async (client, message) => {
    if (message.author.bot || message.channel.type === ChannelType.DM) return;

    const mention = `<@${client.user.id}>`;

    if (message.content.indexOf(mention) !== 0) return;

    const args = message.content.slice(mention.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    const cmd = client.commands.get(command) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(command));

    if (cmd) {
        try {
            await cmd.execute(client, message, args);
        } catch (error) {
            console.error(error);
        }
    }
}