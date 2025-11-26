import { SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";
import { RepeatMode } from "../../../utils/constants";
import { repeatCommand } from "../../../utils/common";

const  modeChoices = [
    {
        name: "Off",
        value: RepeatMode.OFF
    },
    {
        name: "One",
        value: RepeatMode.ONE
    },
    {
        name: "All",
        value: RepeatMode.ALL
    }
];

export default {
    name: "repeat",
    category: "Queue",
    data: new SlashCommandBuilder()
        .setName("repeat")
        .setDescription("Toggles the repeat mode.")
        .addStringOption(option => 
            option.setName("mode")
                .setDescription("Repeat mode.")
                .setChoices(modeChoices)
                .setRequired(true)
        ),
    async execute(bot, interaction) {
        const modeOption = interaction.options.getString("mode")! as RepeatMode;

        repeatCommand(bot, interaction, { mode: modeOption });
    }
} as Command;