module.exports = (client, interaction) => {
    if (!interaction.isCommand()) return;
    
    if (interaction.user.bot || interaction.channel.type === "dm") return;

    const args = interaction.options;
    const slashCommand = interaction.commandName;

    const cmd = client.slashCommands.get(slashCommand);

    if (cmd) {
        try {
            cmd.execute(client, interaction, args);
        } catch (error) {
            console.log(error);
        }
    }
}
