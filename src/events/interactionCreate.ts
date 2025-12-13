import { Events, Interaction, MessageFlags } from "discord.js";

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
            const component = bot.components.get(interaction.customId);

            if (component) {
                try {
                    if (!interaction.inCachedGuild()) {
                        if (interaction.replied || interaction.deferred) await interaction.followUp({ content: "An error while executing this component", flags: MessageFlags.Ephemeral });
                        else await interaction.reply({ content: "An error while executing this component", flags: MessageFlags.Ephemeral });
                    }
                    else await component.execute(bot, interaction);
                }
                catch (e) {
                    console.error(e);

                    if (interaction.replied || interaction.deferred) await interaction.followUp({ content: "An error while executing this component", flags: MessageFlags.Ephemeral });
                    else await interaction.reply({ content: "An error while executing this component", flags: MessageFlags.Ephemeral });
                }
            }
        }
        else return;
    }
} as Event;