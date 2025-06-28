import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import Bot from "./Bot";

interface Command {
    name: string;
    category: string;
    data: SlashCommandBuilder;
    execute(bot: Bot, interaction: ChatInputCommandInteraction<"cached">): Promise<void>
}

export default Command;