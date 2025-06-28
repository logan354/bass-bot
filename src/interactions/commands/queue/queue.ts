import { SlashCommandBuilder } from "discord.js";
import Command from "../../../structures/Command";
import { createQueueEmbed } from "../../../utils/messages";

export default {
    name: "queue",
    category: "Queue",
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("List of items in the queue."),
    async execute(bot, interaction) {
        const player = bot.playerManager.getPlayer(interaction.guild.id);

        if (!player) return;

        interaction.reply({ embeds: [createQueueEmbed(player.queue.items)]});
    }
} as Command;