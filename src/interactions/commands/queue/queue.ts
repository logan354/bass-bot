import { SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";
import { queueCommand } from "../../../utils/common";

export default {
    name: "queue",
    category: "Queue",
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("List of items in the queue."),
    async execute(bot, interaction) {
        queueCommand(bot, interaction);
    }
} as Command;