import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";
import { emojis } from "../../../../config.json";
import { createQueueEmptyMessage } from "../../../utils/messages";

export default {
    name: "next",
    category: "Player",
    data: new SlashCommandBuilder()
        .setName("next")
        .setDescription("Skips to the next item (May require voting).")
        .addBooleanOption(option =>
            option.setName("force")
                .setDescription("Forcefully skips to the next item without voting (Requires the 'Manage Channels' permission).")
                .setRequired(false)
        ),
    async execute(bot, interaction) {
        const player = bot.playerManager.getPlayer(interaction.guild.id);

        if (!interaction.member.voice.channel) {
            await interaction.reply(emojis.error + " **You have to be in a voice channel to use this command.**");
            return;
        }

        if (!player || !player.voiceChannel) {
            await interaction.reply(emojis.error + " **I am not connected to a voice channel.**");
            return;
        }

        if (interaction.member.voice.channel.id !== player.voiceChannel.id) {
            await interaction.reply(emojis.error + " **You need to be in the same voice channel as Bass to use this command.**");
            return;
        }

        if (player.queue.isEmpty()) {
            await interaction.reply(await createQueueEmptyMessage(bot));
            return;
        }

        const forceOption = interaction.options.getBoolean("force") ?? false;

        const voiceChannel = await player.voiceChannel.fetch();
        const voiceChannelMemberCount = voiceChannel.members.filter(x => !x.user.bot).size;

        if (voiceChannelMemberCount > 2 && !forceOption) {
            const requiredVotes = Math.trunc(voiceChannelMemberCount * 0.75);

            if (player.queue.nextVoteList.find(x => x.id === interaction.user.id)) {
                await interaction.reply({ content: emojis.error + " **You already voted to skip to the next item** (" + player.queue.nextVoteList.length + "/" + requiredVotes + " people).", flags: MessageFlags.Ephemeral });
                return;
            }
            else player.queue.nextVoteList.push(interaction.user);

            if (player.queue.nextVoteList.length >= requiredVotes) {
                player.skipToNext();
                await interaction.reply(emojis.next + " **Next**");
                return;
            }
            else {
                const actionRowBuilder = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("next-vote")
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji(emojis.vote)
                    );

                interaction.reply({ content: "**Skip to the next item?** (" + player.queue.nextVoteList.length + "/" + requiredVotes + " people).", components: [actionRowBuilder] });
            }
        }
        else {
            player.skipToNext();
            await interaction.reply(emojis.next + " **Next**");
        }
    }
} as Command;