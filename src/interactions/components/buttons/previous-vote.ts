import Button from "../../../structures/Button";
import { previousCommand } from "../../../utils/common";

export default {
    name: "previous-vote",
    async execute(bot, interaction) {
        previousCommand(bot, interaction);
    },
} as Button