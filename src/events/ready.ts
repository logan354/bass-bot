import { ActivityType, Events, TextChannel, VoiceChannel } from "discord.js";

import Bot from "../structures/Bot";
import Event from "../structures/Event";
import { createAudioPlayer, createAudioResource, joinVoiceChannel } from "@discordjs/voice";
import { FFmpeg } from "prism-media";
import youtubeDl from "youtube-dl-exec";

export default {
    name: Events.ClientReady,
    once: true,
    async execute(bot: Bot) {
        console.log(`Logged to the client ${bot.user?.username}\n-> Ready on ${bot.guilds.cache.size} servers for a total of ${bot.users.cache.size} users`);

        bot.user?.setPresence({
            activities: [
                {
                    name: "Turn up the music with Bass!",
                    type: ActivityType.Custom
                }
            ],
            status: "online"
        });
    }
} as Event;