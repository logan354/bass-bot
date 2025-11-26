import { SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";
import { volumeCommand } from "../../../utils/commands";

export default {
    name: "volume",
    category: "Player",
    data: new SlashCommandBuilder()
        .setName("volume")
        .setDescription("Changes the volume of the player.")
        .addNumberOption(option =>
            option.setName("level")
                .setDescription("Volume level (0 - 200)")
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(200)
        ),
    async execute(bot, interaction) {
        const levelOption = interaction.options.getNumber("level")!;

        volumeCommand(bot, interaction, { level: levelOption });
    }
} as Command;

