import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";
import { emojis } from "../../../../config.json";
import { createQueueEmptyMessage } from "../../../utils/messages";

export default {
    name: "previous",
    category: "Player",
    data: new SlashCommandBuilder()
        .setName("previous")
        .setDescription("Skips to the previous track. Voting enforced when member count is greater than 2.")
        .addBooleanOption(option =>
            option.setName("force")
                .setDescription("Force skips to the previous track without voting. Requires Manage Channels permission.")
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

            if (player.queue.previousVoteList.find(x => x.id === interaction.user.id)) {
                await interaction.reply(emojis.error + " **You already voted to skip to the previous song** (" + player.queue.previousVoteList.length + "/" + requiredVotes + " people)");
                return;
            }
            else player.queue.previousVoteList.push(interaction.user);

            if (player.queue.previousVoteList.length >= requiredVotes) {
                player.skipToPrevious();
                await interaction.reply(emojis.previous + " **Previous**");
            }
            else {
                const actionRowBuilder = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("previous-vote")
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji(emojis.vote)
                    );

                await interaction.reply({ content: "**Skip to the previous song?** (" + player.queue.previousVoteList.length + "/" + requiredVotes + " people)", components: [actionRowBuilder] });
            }
        }
        else {
            player.skipToPrevious();
            await interaction.reply(emojis.previous + " **Previous**");
        }
    }
} as Command;