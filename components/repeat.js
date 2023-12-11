const { Client, ButtonInteraction } = require("discord.js");
const { RepeatMode } = require("../utils/constants");

/**
 * @param {Client} client 
 * @param {ButtonInteraction} interaction 
 */
module.exports = async (client, interaction) => {
    const subscription = client.subscriptions.get(interaction.guild.id);

    const args = [];
    const slashCommand = "repeat";

    const cmd = client.slashCommands.get(slashCommand);

    try {
        await cmd.execute(client, interaction, args);
    } catch (error) {
        console.error(error);
    }

    if (subscription.queue.repeat === RepeatMode.OFF) {
        //interaction.update({ components: [] });
    }
    else if (subscription.queue.repeat === RepeatMode.QUEUE) {
        //interaction.update({ components: [] });
    }
    else {
        //interaction.update({ components: [] });
    }
}