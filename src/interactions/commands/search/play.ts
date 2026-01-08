import { SlashCommandBuilder } from "discord.js";

import { sourceChoices, typeChoices } from "./search";
import Command from "../../../structures/Command";

export default {
    name: "play",
    category: "Search",
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Searches for an item, and adds it to the queue.")
        .addStringOption((option) =>
            option.setName("query")
                .setDescription("Enter a query or link.")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option.setName("source")
                .setDescription("Enter a source to search from. Defaults to 'Youtube'")
                .addChoices(sourceChoices)
                .setRequired(false)
        )
        .addStringOption((option) =>
            option.setName("type")
                .setDescription("Enter a type to search for. Defaults to 'Track'")
                .addChoices(typeChoices)
                .setRequired(false)
        )
        .addBooleanOption((option) =>
            option.setName("play-now")
                .setDescription("Whether to play the item now. Defaults to 'false'")
                .setRequired(false)
        ),
    async execute(bot, interaction) {
        bot.commands.get("search")!.execute(bot, interaction);
    }
} as Command;