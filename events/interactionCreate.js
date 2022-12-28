const { Client, Interaction, ChannelType } = require("discord.js");

/**
 * @param {Client} client 
 * @param {Interaction} interaction 
 */
module.exports = async (client, interaction) => {
    if (!interaction.isCommand()) return;
    
    if (interaction.user.bot || interaction.channel.type === ChannelType.DM) return;

    const args = interaction.options;
    const slashCommand = interaction.commandName;

    const cmd = client.slashCommands.get(slashCommand);

    if (cmd) {
        try {
            await cmd.execute(client, interaction, args);
        } catch (e) {
            console.error(e);
        }
    }
}