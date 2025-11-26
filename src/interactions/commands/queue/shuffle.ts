import { SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";
import { shuffleCommand } from "../../../utils/common";

export default {
    name: "shuffle",
    category: "Queue",
    data: new SlashCommandBuilder()
        .setName("shuffle")
        .setDescription("Shuffles the queue."),
    async execute(bot, interaction) {
        shuffleCommand(bot, interaction);
    }
} as Command;