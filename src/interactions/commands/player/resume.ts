import { SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";
import { resumeCommand } from "../../../utils/common";

export default {
    name: "resume",
    category: "Player",
    data: new SlashCommandBuilder()
        .setName("resume")
        .setDescription("Resumes the current item."),
    async execute(bot, interaction) {
        resumeCommand(bot, interaction);
    }
} as Command;