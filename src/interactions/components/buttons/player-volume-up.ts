import Button from "../../../structures/Button";
import { volumeCommand } from "../../../utils/commands";

export default {
    name: "player-volume-up",
    async execute(bot, interaction) {
        const player = bot.playerManager.getPlayer(interaction.guild.id);

        if (!player) volumeCommand(bot, interaction);
        else volumeCommand(bot, interaction, { level: player.volume + 10 });
    }
} as Button;