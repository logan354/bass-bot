import { PermissionsBitField, SlashCommandBuilder } from "discord.js";

import Command from "../../../structures/Command";
import { createQueueEmptyMessage, createRemovedEmbed } from "../../../utils/components";
import { emojis } from "../../../../config.json";

export default {
    name: "remove",
    category: "Queue",
    data: new SlashCommandBuilder()
        .setName("remove")
        .setDescription("Removes a item from the queue (Requires the 'Manage Channels' permission).")
        .addNumberOption(option =>
            option.setName("position")
                .setDescription("Item position.")
                .setRequired(true)
        ),
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

        if (player.queue.isEmpty()) {
            await interaction.reply(await createQueueEmptyMessage(bot));
            return;
        }

        const voiceChannelMemberCount = interaction.member.voice.channel!.members.filter(x => !x.user.bot).size;

        if (voiceChannelMemberCount > 1 && !interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            await interaction.reply(emojis.permission_error + " **This command requires you to have the Manage Channels permission to use it (being alone with the bot also works)**");
            return;
        }

        const positionOption = interaction.options.getNumber("position")!;

        const embed = createRemovedEmbed(player.queue.items[0]);

        player.queue.remove(positionOption);

        await interaction.reply({ embeds: [embed] });
    }
} as Command;