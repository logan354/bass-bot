import Button from "../../../structures/Button";
import { pauseCommand, resumeCommand } from "../../../utils/commands";

export default {
    name: "player-pause-resume",
    async execute(bot, interaction) {
        const player = bot.playerManager.getPlayer(interaction.guild.id);

        if (!player || player.isPaused()) resumeCommand(bot, interaction);
        else pauseCommand(bot, interaction);
    }
} as Button;