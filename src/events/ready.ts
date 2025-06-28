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

        const textChannel = bot.channels.cache.get("886402406500429864") as TextChannel;
        const voiceChannel = bot.channels.cache.get("1108737889434599575") as VoiceChannel;

        const voiceConnection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        const input = "https://akamd1.jw-cdn.org/sg2/p/a3deaf/3/o/sjjm_E_153.mp3"

        // FFMPEG
        let ffmpegArguments = [
            "-reconnect", "1",
            "-reconnect_streamed", "1",
            "-reconnect_delay_max", "5",
            "-i", input,
            "-analyzeduration", "0",
            "-loglevel", "0",
            "-f", "opus",
            "-ar", "48000",
            "-ac", "2",
        ];

        const stream = new FFmpeg({
            args: ffmpegArguments
        });

        const audioResource = createAudioResource(stream);

        const audioPlayer = createAudioPlayer();

        voiceConnection.subscribe(audioPlayer);

        audioPlayer.play(audioResource);

        const data = await youtubeDl.exec(
            input,
            {
                dumpSingleJson: true,
                noCheckCertificates: true,
                noWarnings: true,
                preferFreeFormats: true,
                skipDownload: true,
                extractAudio: true,
            }
        );

        const dataJSON = JSON.parse(data.stdout);

        console.log(dataJSON)
    }
} as Event;