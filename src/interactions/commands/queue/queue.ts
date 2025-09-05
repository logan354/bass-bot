import { SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";
import { createQueueEmbed, createQueueEmptyMessage } from "../../../utils/messages";
import { emojis } from "../../../../config.json";

export default {
    name: "queue",
    category: "Queue",
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("List of items in the queue."),
    async execute(bot, interaction) {
        const player = bot.playerManager.getPlayer(interaction.guild.id);

        if (!player || !player.voiceChannel) {
            await interaction.reply(emojis.error + " **I am not connected to a voice channel.**");
            return;
        }

        if (player.queue.isEmpty()) {
            await interaction.reply(await createQueueEmptyMessage(bot));
            return;
        }

        await interaction.reply({ embeds: [createQueueEmbed(player.queue.items)] });
    }
} as Command;