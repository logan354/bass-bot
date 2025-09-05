import { SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";
import { emojis } from "../../../../config.json";

export default {
    name: "shuffle",
    category: "Queue",
    data: new SlashCommandBuilder()
        .setName("shuffle")
        .setDescription("Shuffles the queue."),
    async execute(bot, interaction) {
        const player = bot.playerManager.getPlayer(interaction.guild.id);

        if (!interaction.member.voice.channel) {
            await interaction.reply(emojis.error + " **You have to be in a voice channel to use this command**");
            return;
        }

        if (!player || !player.voiceChannel) {
            await interaction.reply(emojis.error + " **I am not connected to a voice channel.**");
            return;
        }

        if (interaction.member.voice.channel.id !== player.voiceChannel.id) {
            await interaction.reply(emojis.error + " **You need to be in the same voice channel as Bass to use this command**");
            return;
        }

        if (!player.isPlaying()) {
            await interaction.reply(emojis.error + " **The player is not playing**");
            return;
        }

        player.queue.shuffle();
        await interaction.reply(emojis.shuffle + " **Shuffled**");
    }
} as Command;