import { SendableChannels } from "discord.js";

import Bot from "../Bot"
import Player from "./Player";

class PlayerManager {
    bot: Bot;

    players: Map<string, Player> = new Map();

    constructor(bot: Bot) {
        this.bot = bot;
    }

    createPlayer(guildId: string, textChannel: SendableChannels): Player {
        const player = new Player(this, guildId, textChannel);
        this.players.set(guildId, player);

        return player;
    }

    getPlayer(guildId: string): Player | undefined {
        return this.players.get(guildId);
    }

    deletePlayer(guildId: string): boolean {
        const player = this.players.get(guildId);

        if (!player) return false;

        // Disconnect the player before deleting
        player.disconnect();
        this.players.delete(guildId);
        
        return true;
    }
}

export default PlayerManager;