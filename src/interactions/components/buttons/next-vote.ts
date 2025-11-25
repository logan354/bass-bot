import Button from "../../../structures/Button";
import { nextCommand } from "../../../utils/commands";

export default {
    name: "next-vote",
    async execute(bot, interaction) {
        nextCommand(bot, interaction);
    },
} as Button