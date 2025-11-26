import Button from "../../../structures/Button";
import { nextCommand } from "../../../utils/common";

export default {
    name: "player-next",
    async execute(bot, interaction) {
        nextCommand(bot, interaction);
    }
} as Button;