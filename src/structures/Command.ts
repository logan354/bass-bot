import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import Interaction from "./Interaction";
import Bot from "./Bot";

interface Command extends Interaction {
    category: string;
    data: SlashCommandBuilder;
    execute(bot: Bot, interaction: ChatInputCommandInteraction<"cached">): Promise<void>
}

export default Command;