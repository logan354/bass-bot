import { MessageFlags } from "discord.js";

import Button from "../../structures/Button";
import { createQueueEmptyMessage } from "../../utils/messages";
import { emojis } from "../../../config.json";

export default {
    name: "previous-vote",
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

        const voiceChannel = await player.voiceChannel.fetch();
        const voiceChannelMemberCount = voiceChannel.members.filter(x => !x.user.bot).size;

        if (voiceChannelMemberCount > 2) {
            const requiredVotes = Math.trunc(voiceChannelMemberCount * 0.75);

            if (player.queue.previousVoteList.find(x => x.id === interaction.user.id)) {
                await interaction.reply({ content: emojis.error + " **You already voted to skip to the previous item** (" + player.queue.previousVoteList.length + "/" + requiredVotes + " people).", flags: MessageFlags.Ephemeral });
                return;
            }
            else player.queue.previousVoteList.push(interaction.user);

            if (player.queue.previousVoteList.length >= requiredVotes) {
                player.skipToPrevious();
                await interaction.reply(emojis.previous + " **Previous**");
            }
            else await interaction.reply("**Skip to the previous item?** (" + player.queue.previousVoteList.length + "/" + requiredVotes + " people).");
        }
        else {
            player.skipToPrevious();
            await interaction.reply(emojis.previous + " **Previous**");
        }
    },
} as Button