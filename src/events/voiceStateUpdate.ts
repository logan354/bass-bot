import { Events, VoiceState } from "discord.js";
import Event from "../structures/Event";

export default {
    name: Events.VoiceStateUpdate,
    once: false,
    async execute(bot, oldState: VoiceState, newState: VoiceState) {
        const player = bot.playerManager.getPlayer(oldState.guild.id);

        if (oldState.id === bot.user?.id) {
            if (player) {
                if (oldState.channel && newState.channel && newState.channel.id !== oldState.channel.id) {
                    // Bot has been forcefully moved to another channel
                    player.voiceChannel = newState.channel;
                }
                else if (oldState.channel && !newState.channel) {
                    // Bot has been forcefully disconnected
                }
            }
        }
    }
} as Event;