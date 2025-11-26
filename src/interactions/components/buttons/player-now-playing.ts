import Button from "../../../structures/Button";
import { nowPlayingCommand } from "../../../utils/commands";

export default {
    name: "player-now-playing",
    async execute(bot, interaction) {
        nowPlayingCommand(bot, interaction);
    }
} as Button;