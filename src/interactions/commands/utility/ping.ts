import { SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";
import { emojis } from "../../../../config.json";

export default {
    name: "ping",
    category: "Utility",
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("The bot's response time to Discord."),
    async execute(bot, interaction) {
        await interaction.reply(emojis.ping + " **Ping**: `" + bot.ws.ping + "ms`")
    },
} as Command;