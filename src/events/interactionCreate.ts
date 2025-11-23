import { ChannelType, Events, Interaction, MessageFlags } from "discord.js";
import Bot from "../structures/Bot";
import Event from "../structures/Event";

export default {
    name: Events.InteractionCreate,
    once: false,
    async execute(bot: Bot, interaction: Interaction) {
        if (interaction.user.bot) return;

        if (interaction.isChatInputCommand()) {
            const command = bot.commands.get(interaction.commandName);

            if (command) {
                try {
                    if (!interaction.inCachedGuild()) {
                        if (interaction.replied || interaction.deferred) await interaction.followUp({ content: "An error while executing this command", flags: MessageFlags.Ephemeral });
                        else await interaction.reply({ content: "An error while executing this command", flags: MessageFlags.Ephemeral });
                    }
                    else await command.execute(bot, interaction);
                }
                catch (e) {
                    console.error(e);

                    if (interaction.replied || interaction.deferred) await interaction.followUp({ content: "An error while executing this command", flags: MessageFlags.Ephemeral });
                    else await interaction.reply({ content: "An error while executing this command", flags: MessageFlags.Ephemeral });
                }
            }
        }
        else if (interaction.isButton()) {
            const button = bot.components.get(interaction.customId);

            if (button) {
                try {
                    if (!interaction.inCachedGuild()) {
                        if (interaction.replied || interaction.deferred) await interaction.followUp({ content: "An error while executing this button", flags: MessageFlags.Ephemeral });
                        else await interaction.reply({ content: "An error while executing this button", flags: MessageFlags.Ephemeral });
                    }
                    else await button.execute(bot, interaction);
                }
                catch (e) {
                    console.error(e);

                    if (interaction.replied || interaction.deferred) await interaction.followUp({ content: "An error while executing this button", flags: MessageFlags.Ephemeral });
                    else await interaction.reply({ content: "An error while executing this button", flags: MessageFlags.Ephemeral });
                }
            }
        }
        else return;
    }
} as Event;