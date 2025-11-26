import Button from "../../../structures/Button";
import { previousCommand } from "../../../utils/commands";

export default {
    name: "previous-vote",
    async execute(bot, interaction) {
        previousCommand(bot, interaction);
    },
} as Button