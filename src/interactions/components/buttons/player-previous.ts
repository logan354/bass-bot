import Button from "../../../structures/Button";
import { previousCommand } from "../../../utils/common";

export default {
    name: "player-previous",
    async execute(bot, interaction) {
        previousCommand(bot, interaction);
    }
} as Button;