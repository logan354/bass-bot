import { SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";
import { emojis } from "../../../../config.json";

export default {
    name: "volume",
    category: "Player",
    data: new SlashCommandBuilder()
        .setName("volume")
        .setDescription("Changes the volume of the player.")
        .addNumberOption(option =>
            option.setName("level")
                .setDescription("Force")
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(200)
        ),
    async execute(bot, interaction) {
        const player = bot.playerManager.getPlayer(interaction.guild.id);

        if (!player || !player.voiceChannel) {
            await interaction.reply(emojis.error + " **I am not connected to a voice channel.**");
            return;
        }

        if (!interaction.member.voice.channel) {
            await interaction.reply(emojis.error + " **You have to be in a voice channel to use this command**");
            return;
        }


        if (interaction.member.voice.channel.id !== player.voiceChannel.id) {
            await interaction.reply(emojis.error + " **You need to be in the same voice channel as Bass to use this command**");
            return;
        }

        const volumeOption = interaction.options.getNumber("level")!;

        let volumeEmoji;
        if (volumeOption === 0) volumeEmoji = emojis.volume_muted;
        else if (volumeOption < 25) volumeEmoji = emojis.volume_low;
        else if (volumeOption < 75) volumeEmoji = emojis.volume_medium;
        else volumeEmoji = emojis.volume_high;

        player.setVolume(volumeOption);
        await interaction.reply(volumeEmoji + " **Volume level is now set to " + player.volume + "%**");
    }
} as Command;