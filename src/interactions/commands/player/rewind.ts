import { SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";

export default {
    name: "rewind",
    category: "Player",
    data: new SlashCommandBuilder()
        .setName("rewind")
        .setDescription("Rewinds to a timestamp on the track currently playing.")
        .addStringOption(option =>
            option.setName("timestamp")
                .setDescription("45s, 1h24m, 5:30")
                .setRequired(true),
        ),
    async execute(bot, interaction) {
        const seekCommand = bot.commands.get("seek");
        seekCommand!.execute(bot, interaction);
    }
} as Command;