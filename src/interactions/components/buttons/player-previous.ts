import Button from "../../../structures/Button";
import { previousCommand } from "../../../utils/commands";

export default {
    name: "player-previous",
    async execute(bot, interaction) {
        previousCommand(bot, interaction, false);
    }
} as Button;