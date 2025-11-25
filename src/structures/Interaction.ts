import { ButtonInteraction, ChatInputCommandInteraction } from "discord.js";

import Bot from "./Bot";

interface Interaction {
    name: string;
    execute(bot: Bot, interaction: ChatInputCommandInteraction<"cached"> | ButtonInteraction<"cached">): Promise<void>
}

export default Interaction;