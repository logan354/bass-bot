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

        if (!subscription.queue.length) return message.channel.send(client.emotes.error + " **Nothing is in the queue**, let's get this party started! :tada:");


        let repeatEmoji = "❌";
        let repeatTrackEmoji = "❌";
        if (subscription.repeat === RepeatMode.QUEUE) repeatEmoji = "✅";
        else if (subscription.repeat === RepeatMode.TRACK) repeatTrackEmoji = "✅";

        if (subscription.queue.length === 1) {
            const embed = new EmbedBuilder()
                .setColor("DarkGreen")
                .setAuthor({
                    name: "Queue for " + message.guild.name,
                    iconURL: message.guild.iconURL()
                })
                .setDescription("__**Now Playing**__\n" + `[${subscription.queue[0].title}](${subscription.queue[0].url})\n` + subscription.queue[0].channel + " **|** `" + subscription.queue[0].durationFormatted + "`")
                .setFields(
                    {
                        name: "Voice Channel",
                        value: `<#${subscription.voiceChannel.id}>`,
                        inline: true
                    }
                )
                .setFooter({
                    text: "Page: 1/1" + " | Repeat: " + repeatEmoji + " | Repeat Track: " + repeatTrackEmoji,
                    iconURL: client.user.avatarURL()
                });

            message.channel.send({ embeds: [embed] });
        } else {
            // Format the queue
            const queueFmt = subscription.queue.map((track, i) => "`" + i + ".` " + `[${track.title}](${track.url})\n` + track.channel + " **|** `" + track.durationFormatted + "`").slice(1, subscription.queue.length);

            // Split the queue into pages
            const pageSize = 5;
            const pages = formatChunk(queueFmt, pageSize).map((x) => x.join("\n\n"));;

            let totalDuration = 0;
            for (let i = 0; i < subscription.queue.length; i++) {
                totalDuration += subscription.queue[i].duration;
            }

            let currentPage = 1;

            const embed = new EmbedBuilder()
                .setColor("DarkGreen")
                .setAuthor({
                    name: "Queue for " + message.guild.name,
                    iconURL: message.guild.iconURL()
                })
                .setDescription("__**Now Playing**__\n" + `[${subscription.queue[0].title}](${subscription.queue[0].url})\n` + subscription.queue[0].channel + " **|** `" + subscription.queue[0].durationFormatted + "`" + "\n\n__**Up Next**__\n" + pages[currentPage - 1])
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
                    text: "Page: 1/" + pages.length + " | Repeat: " + repeatEmoji + " | Repeat Track: " + repeatTrackEmoji,
                    iconURL: client.user.avatarURL()
                });


            // Configure page shiftiablity
            if (pages.length > 1) {
                const uid = new Date().getTime();

                const row = new ActionRowBuilder()
                    .addComponents(
                        [
                            new ButtonBuilder()
                                .setCustomId("block")
                                .setStyle(ButtonStyle.Secondary)
                                .setLabel("\u200B"),
                            new ButtonBuilder()
                                .setCustomId("queue-previous-page" + `.id${uid}`)
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji("⬅️")
                                .setDisabled(),
                            new ButtonBuilder()
                                .setCustomId("queue-trash" + `.id${uid}`)
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji("🗑️"),
                            new ButtonBuilder()
                                .setCustomId("queue-next-page" + `.id${uid}`)
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji("➡️"),
                            new ButtonBuilder()
                                .setCustomId("block2")
                                .setStyle(ButtonStyle.Secondary)
                                .setLabel("\u200B")
                        ]
                    );

                const queueMessage = await message.channel.send({ embeds: [embed], components: [row] });

                const collector = message.channel.createMessageComponentCollector(
                    {
                        filter: x => x.user.id === message.author.id,
                        time: 60000,
                        errors: ["time", "user"]
                    }
                );

                collector.on("collect", async (i) => {
                    if (!i.isButton()) return;

                    if (i.customId === "queue-previous-page" + `.id${uid}`) {
                        const newRow = new ActionRowBuilder(row);

                        currentPage--;
                        if (currentPage === 1) newRow.components[1].setDisabled();
                        else newRow.components[3].setDisabled(false);

                        const newEmbed = new EmbedBuilder(embed)
                            .setDescription("__**Now Playing**__\n" + `[${subscription.queue[0].title}](${subscription.queue[0].url})\n` + subscription.queue[0].channel + " **|** `" + subscription.queue[0].durationFormatted + "`" + "\n\n__**Up Next**__\n" + pages[currentPage - 1])
                            .setFooter({
                                text: "Page: " + currentPage + "/" + pages.length + " | Repeat: " + repeatEmoji + " | Repeat Track: " + repeatTrackEmoji,
                                iconURL: client.user.avatarURL()
                            });

                        i.update({ embeds: [newEmbed], components: [newRow] });
                    }
                    else if (i.customId === "queue-trash" + `.id${uid}`) {
                        await i.deferUpdate();

                        collector.stop();
                    }
                    else if (i.customId === "queue-next-page" + `.id${uid}`) {
                        const newRow = new ActionRowBuilder(row);

                        currentPage++;
                        if (currentPage === pages.length) newRow.components[3].setDisabled();
                        else newRow.components[1].setDisabled(false);

                        const newEmbed = new EmbedBuilder(embed)
                            .setDescription("__**Now Playing**__\n" + `[${subscription.queue[0].title}](${subscription.queue[0].url})\n` + subscription.queue[0].channel + " **|** `" + subscription.queue[0].durationFormatted + "`" + "\n\n__**Up Next**__\n" + pages[currentPage - 1])
                            .setFooter({
                                text: "Page: " + currentPage + "/" + pages.length + " | Repeat: " + repeatEmoji + " | Repeat Track: " + repeatTrackEmoji,
                                iconURL: client.user.avatarURL()
                            });

                        i.update({ embeds: [newEmbed], components: [newRow] });
                    }
                    else return;
                });

                collector.on("end", (collected, reason) => {
                    if (reason === "time" || reason === "user") {
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