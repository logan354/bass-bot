import { SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";
import { pauseCommand } from "../../../utils/common";

export default {
    name: "pause",
    category: "Player",
    data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Pauses the current item."),
    async execute(bot, interaction) {
        pauseCommand(bot, interaction);
    }
} as Command;