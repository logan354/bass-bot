import { SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";
import { RepeatMode } from "../../../utils/constants";
import { repeatCommand } from "../../../utils/commands";

const modeChoices = [
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
        repeatCommand(bot, interaction, interaction.options.getString("mode")! as RepeatMode);
    }
} as Command;