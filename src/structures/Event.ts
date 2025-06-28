import { ClientEvents, Events } from "discord.js";
import Bot from "./Bot";

interface Event {
    name: Events;
    once: boolean;
    execute(bot: Bot, ...args: ClientEvents[keyof ClientEvents]): Promise<void>
}

export default Event;