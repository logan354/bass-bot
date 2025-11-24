import { SlashCommandBuilder } from "discord.js";
import Command from "../../../structures/Command";
import { AudioMediaSource } from "../../../utils/constants";

const sourceChoices = [
    {
        name: "YouTube",
        value: AudioMediaSource.YOUTUBE
    },
    {
        name: "SoundCloud",
        value: AudioMediaSource.SOUNDCLOUD
    }
];

export default {
    name: "play",
    category: "Search",
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Searches for an item, adds it to the queue, or resumes the player.")
        .addStringOption(option =>
            option.setName("query")
                .setDescription("Enter a query or link.")
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName("source")
                .setDescription("Enter a source to search from.")
                .addChoices(sourceChoices)
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option.setName("play-now")
                .setDescription("Whether to play the item now.")
                .setRequired(false)
        ),
    async execute(bot, interaction) {
        if (interaction.options.getString("query")) bot.commands.get("search")!.execute(bot, interaction);
        else bot.commands.get("resume")!.execute(bot, interaction);
    }
} as Command;