const { Client, Interaction, ChannelType } = require("discord.js");

/**
 * @param {Client} client 
 * @param {Interaction} interaction 
 */
module.exports = async (client, interaction) => {
    if (interaction.isCommand()) {
        if (interaction.user.bot || interaction.channel.type === ChannelType.DM) return;

        const args = interaction.options;
        const slashCommand = interaction.commandName;

        const cmd = client.slashCommands.get(slashCommand);

        if (cmd) {
            try {
                await cmd.execute(client, interaction, args);
            } catch (error) {
                console.error(error);
            }
        }
    }
    else if (interaction.isButton()) {
        if (interaction.user.bot || interaction.channel.type === ChannelType.DM) return;

        const button = interaction.customId;

        const btn = client.buttons.get(button);

        console.log(btn)

        if (btn) {
            try {
                await btn(client, interaction);
            } catch (error) {
                console.error(error);
            }
        }
    }
    else return;
}