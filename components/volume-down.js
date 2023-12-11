const { Client, ButtonInteraction } = require("discord.js");

/**
 * @param {Client} client 
 * @param {ButtonInteraction} interaction 
 */
module.exports = async (client, interaction) => {
    const subscription = client.subscriptions.get(interaction.guild.id);

    const args = [subscription.volume - 10];
    const slashCommand = "volume";

    const cmd = client.slashCommands.get(slashCommand);

    try {
        await cmd.execute(client, interaction, args);
    } catch (error) {
        console.error(error);
    }
}