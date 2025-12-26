import Button from "../../../structures/Button";
import { repeatCommand } from "../../../utils/commands";
import { RepeatMode } from "../../../utils/constants";

export default {
    name: "player-repeat",
    async execute(bot, interaction) {
        const player = bot.playerManager.getPlayer(interaction.guild.id);

        if (!player) repeatCommand(bot, interaction, RepeatMode.OFF);
        else {
            if (player.queue.repeatMode === RepeatMode.OFF) repeatCommand(bot, interaction, RepeatMode.ALL);
            else if (player.queue.repeatMode === RepeatMode.ALL) repeatCommand(bot, interaction, RepeatMode.ONE );
            else repeatCommand(bot, interaction, RepeatMode.OFF);
        }
    }
} as Button;