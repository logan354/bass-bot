import { SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";

export default {
    name: "rewind",
    category: "Player",
    data: new SlashCommandBuilder()
        .setName("rewind")
        .setDescription("Jumps to a specific timestamp in the currently playing item.")
        .addStringOption(option =>
            option.setName("timestamp")
                .setDescription("Examples: 10, 10s, 0:10")
                .setRequired(true),
        ),
    async execute(bot, interaction) {
        bot.commands.get("seek")!.execute(bot, interaction);
    }
} as Command;