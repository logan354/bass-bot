import { SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";
import { nextCommand } from "../../../utils/common";

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
        const forceOption = interaction.options.getBoolean("force") ?? false;
        
        nextCommand(bot, interaction, { force: forceOption });
    }
} as Command;