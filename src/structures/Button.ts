import { ButtonInteraction } from "discord.js";
import Bot from "./Bot";

interface Button {
    name: string;
    execute(bot: Bot, interaction: ButtonInteraction<"cached">): Promise<void>
}

export default Button;