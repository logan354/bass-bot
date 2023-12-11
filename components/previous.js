const { Client, ButtonInteraction } = require("discord.js");

/**
 * @param {Client} client 
 * @param {ButtonInteraction} interaction 
 */
module.exports = async (client, interaction) => {
    const args = [];
    const slashCommand = "previous";

    const cmd = client.slashCommands.get(slashCommand);

    try {
        await cmd.execute(client, interaction, args);
    } catch (error) {
        console.error(error);
    }
}