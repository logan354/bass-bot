import { SlashCommandBuilder } from "discord.js";
import Command from "../../../structures/Command";
import { emojis } from "../../../../config.json";
import { QueueableAudioMediaType } from "../../../utils/constants";
import Track from "../../../structures/models/Track";

export default {
    name: "move",
    category: "Queue",
    data: new SlashCommandBuilder()
        .setName("move")
        .setDescription("Moves a item to a different location in the queue.")
        .addIntegerOption(option =>
            option.setName("index")
                .setDescription("Item position.")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("position")
                .setDescription("Queue position.")
                .setRequired(true)
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

        if (!player.isPlaying()) {
            await interaction.reply(emojis.error + " **The player is not playing.**");
            return;
        }

        const indexOption = interaction.options.getInteger("index")!;
        const positionOption = interaction.options.getInteger("position")!;

        const item = player.queue.get(indexOption);
        let itemTitle = "";

        if (item.type === QueueableAudioMediaType.TRACK) {
            const track = item as Track;

            itemTitle = track.title;
        }

        player.queue.move(indexOption, positionOption);
        await interaction.reply(`${emojis.move} Moved ${itemTitle} from ${indexOption} to ${positionOption}`);
    }
} as Command;