import { SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";
import { previousCommand } from "../../../utils/common";

export default {
    name: "previous",
    category: "Player",
    data: new SlashCommandBuilder()
        .setName("previous")
        .setDescription("Skips to the previous item (May require voting).")
        .addBooleanOption(option =>
            option.setName("force")
                .setDescription("Forcefully skips to the previous item without voting (Requires the 'Manage Channels' permission).")
                .setRequired(false)
        ),
    async execute(bot, interaction) {
        const forceOption = interaction.options.getBoolean("force") ?? false;

        previousCommand(bot, interaction, { force: forceOption });
    }
} as Command;