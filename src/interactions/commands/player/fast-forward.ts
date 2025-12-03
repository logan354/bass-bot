import { SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";

export default {
    name: "fast-forward",
    category: "Player",
    data: new SlashCommandBuilder()
        .setName("fast-forward")
        .setDescription("Jumps to a specific timestamp in the currently playing item.")
        .addStringOption(option =>
            option.setName("time")
                .setDescription("Examples: 10, 10s, 0:10")
                .setRequired(true),
        ),
    async execute(bot, interaction) {
        bot.commands.get("seek")!.execute(bot, interaction);
    }
} as Command;