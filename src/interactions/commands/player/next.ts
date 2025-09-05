import { SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";
import { emojis } from "../../../../config.json";
import { createQueueEmptyMessage } from "../../../utils/messages";

export default {
    name: "next",
    category: "Player",
    data: new SlashCommandBuilder()
        .setName("next")
        .setDescription("Skips to the next track. Voting enforced when member count is greater than 2.")
        .addBooleanOption(option =>
            option.setName("force")
                .setDescription("Force skips to the next track without voting. Requires Manage Channels permission.")
                .setRequired(false)
        ),
    async execute(bot, interaction) {
        const forceOption = interaction.options.getBoolean("force") ?? false;
        
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

        if (player.queue.isEmpty()) {
            await interaction.reply(await createQueueEmptyMessage(bot));
            return;
        }

        const voiceChannelMemberCount = interaction.member.voice.channel.members.filter(x => !x.user.bot).size;

        if (voiceChannelMemberCount > 2 && !forceOption) {
            const requiredVotes = Math.trunc(voiceChannelMemberCount * 0.75);

            if (player.queue.nextVoteList.find(x => x.id === interaction.user.id)) {
                await interaction.reply(emojis.error + " **You already voted to skip to the next song** (" + player.queue.nextVoteList.length + "/" + requiredVotes + " people)");
                return;
            }
            else player.queue.nextVoteList.push(interaction.user);

            if (player.queue.nextVoteList.length >= requiredVotes) {
                player.skipToNext();
                await interaction.reply(emojis.next + " **Next**");
                return;
            }
            else interaction.reply("**Skip to the next song?** (" + player.queue.nextVoteList.length + "/" + requiredVotes + " people)");
        }
        else {
            player.skipToNext();
            await interaction.reply(emojis.next + " **Next**");
        }
    }
} as Command;