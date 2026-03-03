import Button from "../../../structures/Button";
import { volumeCommand } from "../../../utils/commands";

export default {
    name: "player-volume-down",
    async execute(bot, interaction) {
        const player = bot.playerManager.getPlayer(interaction.guild.id);

        if (!player) volumeCommand(bot, interaction, 100);
        else volumeCommand(bot, interaction, player.getVolume() - 10);
    }
} as Button;