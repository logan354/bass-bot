import Button from "../../../structures/Button";
import { nowPlayingCommand } from "../../../utils/common";

export default {
    name: "player-now-playing",
    async execute(bot, interaction) {
        nowPlayingCommand(bot, interaction);
    }
} as Button;