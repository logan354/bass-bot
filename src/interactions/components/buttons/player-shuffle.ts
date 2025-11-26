import Button from "../../../structures/Button";
import { shuffleCommand } from "../../../utils/common";

export default {
    name: "player-shuffle",
    async execute(bot, interaction) {
        shuffleCommand(bot, interaction);
    }
} as Button;