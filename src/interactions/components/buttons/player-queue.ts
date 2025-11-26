import Button from "../../../structures/Button";
import { queueCommand } from "../../../utils/common";

export default {
    name: "player-queue",
    async execute(bot, interaction) {
        queueCommand(bot, interaction);
    }
} as Button;