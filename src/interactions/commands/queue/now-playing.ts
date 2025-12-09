import { SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";
import { nowPlayingCommand } from "../../../utils/commands";

export default {
    name: "now-playing",
    category: "Queue",
    data: new SlashCommandBuilder()
        .setName("now-playing")
        .setDescription("The track currently playing."),
    async execute(bot, interaction) {
        nowPlayingCommand(bot, interaction);
    }
} as Command;