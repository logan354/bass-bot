module.exports = (client, interaction) => {
    if (interaction.user.bot || interaction.channel.type === "dm") return;

    const args = interaction.options;
    const command = interaction.commandName;

    const cmd = client.commands.get(command);

    if (cmd) cmd.slashCommand.execute(client, interaction, args);
}
