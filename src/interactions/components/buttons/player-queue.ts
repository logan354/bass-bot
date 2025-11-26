import Button from "../../../structures/Button";
import { queueCommand } from "../../../utils/commands";

export default {
    name: "player-queue",
    async execute(bot, interaction) {
        queueCommand(bot, interaction);
    }
} as Button;