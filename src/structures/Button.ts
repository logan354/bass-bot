import { ButtonInteraction } from "discord.js";

import Interaction from "./Interaction";
import Bot from "./Bot";

interface Button extends Interaction {
    execute(bot: Bot, interaction: ButtonInteraction<"cached">): Promise<void>
}

export default Button;