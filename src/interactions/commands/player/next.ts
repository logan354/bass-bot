import { SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";
import { nextCommand } from "../../../utils/commands";

export default {
    name: "next",
    category: "Player",
    data: new SlashCommandBuilder()
        .setName("next")
        .setDescription("Skips to the next item (May require voting).")
        .addBooleanOption(option =>
            option.setName("force")
                .setDescription("Forcefully skips to the next item without voting (Requires the 'Manage Channels' permission).")
                .setRequired(false)
        ),
    async execute(bot, interaction) {
        nextCommand(bot, interaction, interaction.options.getBoolean("force") ?? false);
    }
} as Command;