const { Client, ButtonInteraction } = require("discord.js");

/**
 * @param {Client} client 
 * @param {ButtonInteraction} interaction 
 */
module.exports = async (client, interaction) => {
    const subscription = client.subscriptions.get(interaction.guild.id);

    if (subscription.isPaused()) {
        const args = [];
        const slashCommand = "resume";

        const cmd = client.slashCommands.get(slashCommand);

        try {
            await cmd.execute(client, interaction, args);
        } catch (error) {
            console.error(error);
        }

        //interaction.update({ components: [] });
    }
    else {
        const args = [];
        const slashCommand = "pause";

        const cmd = client.slashCommands.get(slashCommand);

        try {
            await cmd.execute(client, interaction, args);
        } catch (error) {
            console.error(error);
        }

        //interaction.update({ components: [] });
    }
}