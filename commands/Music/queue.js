const { Client, Message, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const MusicSubscription = require("../../structures/MusicSubscription");
const { RepeatMode } = require("../../utils/constants");
const { formatChunk, formatDuration } = require("../../utils/formats");

module.exports = {
    name: "queue",
    aliases: ["q"],
    category: "Music",
    description: "Displays the queue.",
    utilisation: "queue",

    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {string[]} args 
     */
    async execute(client, message, args) {
        /**
         * @type {MusicSubscription}
         */
        const subscription = client.subscriptions.get(message.guild.id);

        const botPermissionsFor = message.channel.permissionsFor(message.guild.members.me);
        if (!botPermissionsFor.has(PermissionsBitField.Flags.UseExternalEmojis)) return message.channel.send(client.emotes.permissionError + " **I do not have permission to Use External Emojis in** <#" + message.channel.id + ">");
        if (!botPermissionsFor.has(PermissionsBitField.Flags.EmbedLinks)) return message.channel.send(client.emotes.permissionError + " **I do not have permission to Embed Links in** <#" + message.channel.id + ">");

        if (!subscription || !subscription.connection) return message.channel.send(client.emotes.error + " **I am not connected to a voice channel.**");

        if (!subscription.queue.length) return message.channel.send(client.emotes.error + " **Nothing is queued in this server**, let's get this party started! :tada:");

        let repeatEmoji;
        if (subscription.repeat === RepeatMode.OFF) repeatEmoji = "❌";
        else if (subscription.repeat === RepeatMode.QUEUE) repeatEmoji = client.emotes.repeat
        else repeatEmoji = client.emotes.repeatTrack

        if (subscription.queue.length === 1) {
            const embed = new EmbedBuilder()
                .setColor("DarkGreen")
                .setAuthor({
                    name: "Queue for " + message.guild.name,
                    iconURL: message.guild.iconURL()
                })
                .setDescription("__**Now Playing**__\n" + `[${subscription.queue[0].title}](${subscription.queue[0].url})\n` + "`" + subscription.queue[0].durationFormatted + "` **|** Requested by: <@" + subscription.queue[0].requestedBy + ">")
                .addField("Voice Channel", `<#${subscription.voiceChannel.id}>`, true)
                .setFooter({
                    text: "Page 1/1" + " | Repeat: ",
                    iconURL: client.user.avatarURL()
                });

            message.channel.send({ embeds: [embed] });
        } else {
            // Format the queue for the embed
            const queue = subscription.queue.map((track, i) => "`" + i + ".` " + `[${track.title}](${track.url})\n` + "`" + track.durationFormatted + "` **|** Requested by: <@" + track.requestedBy + ">").slice(1, subscription.queue.length);
            // Split the queue iton pages for the embed
            const pages = formatChunk(queue, 5).map((x) => x.join("\n\n"));
            // The current page for the embed
            let currentPage = 1;

            // Total duration
            let totalDuration = 0;
            for (let i = 0; i < subscription.queue.length; i++) {
                totalDuration += subscription.queue[i].duration;
            }

            const embed = new EmbedBuilder()
                .setColor("DarkGreen")
                .setAuthor({
                    name: "Queue for " + message.guild.name,
                    iconURL: message.guild.iconURL()
                })
                .setDescription("__**Now Playing**__\n" + `[${subscription.queue[0].title}](${subscription.queue[0].url})\n` + "`" + subscription.queue[0].durationFormatted + "` **|** Requested by: <@" + subscription.queue[0].requestedBy + ">" + "\n\n__**Up Next**__\n" + pages[currentPage - 1])
                .setFields(
                    {
                        name: "Total songs:",
                        value: "`" + (subscription.queue.length - 1) + "`",
                        inline: true
                    },
                    {
                        name: "Total Length:",
                        value: "`" + formatDuration(totalDuration - subscription.queue[0].duration) + "`",
                        inline: true
                    },
                    {
                        name: "Voice Channel",
                        value: `<#${subscription.voiceChannel.id}>`,
                        inline: true
                    }

                )
                .setFooter({
                    text: "Page 1/" + pages.length + " | Repeat: " + repeatEmoji,
                    iconURL: client.user.avatarURL()
                });


            // Configure page changeability
            if (pages.length > 1) {
                const uid = new Date().getTime();

                const row = new ActionRowBuilder()
                    .addComponents(
                        [
                            new ButtonBuilder()
                                .setCustomId("queue-previous-page" + `id${uid}`)
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji("⬅️"),
                            new ButtonBuilder()
                                .setCustomId("queue-trash" + `id${uid}`)
                                .setStyle(ButtonStyle.Danger)
                                .setEmoji("🗑️"),
                            new ButtonBuilder()
                                .setCustomId("queue-next-page" + `id${uid}`)
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji("➡️")
                        ]
                    );

                const queueMessage = await message.channel.send({ embeds: [embed], components: [row] });

                const collector = message.channel.createMessageComponentCollector(
                    {
                        time: 60000,
                        errors: ["time", "user"],
                        filter: x => x.user.id === message.author.id
                    }
                );

                collector.on("collect", async (interaction) => {
                    if (!interaction.isButton()) return;

                    if (interaction.customId === "queue-previous-page" + `id${uid}`) {
                        await interaction.deferUpdate();

                        currentPage--;
                        const newEmbed = new EmbedBuilder(embed)
                            .setDescription("__**Now Playing**__\n" + `[${subscription.queue[0].title}](${subscription.queue[0].url})\n` + "`" + subscription.queue[0].durationFormatted + "` **|** Requested by: <@" + subscription.queue[0].requestedBy + ">" + "\n\n__**Up Next**__\n" + pages[currentPage - 1])
                            .setFooter({
                                text: "Page " + currentPage + "/" + pages.length + " | Repeat: " + repeatEmoji,
                                iconURL: client.user.avatarURL()
                            });

                        queueMessage.edit({ embeds: [newEmbed], components: [row] });
                    }
                    else if (interaction.customId === "queue-trash" + `id${uid}`) {
                        await interaction.deferUpdate();

                        collector.stop();
                    }
                    else if (interaction.customId === "queue-next-page" + `id${uid}`) {
                        await interaction.deferUpdate();

                        currentPage++;
                        const newEmbed = new EmbedBuilder(embed)
                            .setDescription("__**Now Playing**__\n" + `[${subscription.queue[0].title}](${subscription.queue[0].url})\n` + "`" + subscription.queue[0].durationFormatted + "` **|** Requested by: <@" + subscription.queue[0].requestedBy + ">" + "\n\n__**Up Next**__\n" + pages[currentPage - 1])
                            .setFooter({
                                text: "Page " + currentPage + "/" + pages.length + " | Repeat: " + repeatEmoji,
                                iconURL: client.user.avatarURL()
                            });

                        queueMessage.edit({ embeds: [newEmbed], components: [row] });
                    }
                    else return;
                });

                collector.on("end", (collection, reason) => {
                    if (reason === "time" || "user") {
                        queueMessage.edit({ components: [] });
                    }
                });
            }
            else {
                message.channel.send({ embeds: [embed] });
            }
        }
    }
}