import { SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";
import { emojis } from "../../../../config.json";
import { RepeatMode } from "../../../utils/constants";

const  modeChoices = [
    {
        name: "Off",
        value: RepeatMode.OFF
    },
    {
        name: "One",
        value: RepeatMode.ONE
    },
    {
        name: "All",
        value: RepeatMode.ALL
    }
];

export default {
    name: "repeat",
    category: "Queue",
    data: new SlashCommandBuilder()
        .setName("repeat")
        .setDescription("Toggles the repeat mode.")
        .addStringOption(option => 
            option.setName("mode")
                .setDescription("Repeat mode.")
                .setChoices(modeChoices)
                .setRequired(true)
        ),
    async execute(bot, interaction) {
        const modeOption = interaction.options.getString("mode");

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

        if (modeOption === RepeatMode.ONE) {
            player.queue.repeatMode = RepeatMode.ONE;
            await interaction.reply(emojis.repeat_one + " **One**");
        }
        else if (modeOption === RepeatMode.ALL) {
            player.queue.repeatMode = RepeatMode.ALL;
            await interaction.reply(emojis.repeat + " **All**");
        }
        else {
            player.queue.repeatMode = RepeatMode.OFF;
            await interaction.reply(emojis.repeat + " **Off**");
        }
    }
} as Command;