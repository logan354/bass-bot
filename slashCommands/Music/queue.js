const { Client, CommandInteraction, CommandInteractionOptionResolver, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const MusicSubscription = require("../../structures/MusicSubscription");
const { RepeatMode } = require("../../utils/constants");
const { formatChunk, formatDuration } = require("../../utils/formatters");

module.exports = {
    name: "queue",
    category: "Music",
    description: "Displays the queue.",
    utilisation: "queue",

    /**
     * @param {Client} client 
     * @param {CommandInteraction} interaction
     * @param {CommandInteractionOptionResolver} args 
     */
    async execute(client, interaction, args) {
        /**
         * @type {MusicSubscription}
         */
        const subscription = client.subscriptions.get(interaction.guild.id);

        const botPermissionsFor = interaction.channel.permissionsFor(interaction.guild.members.me);
        if (!botPermissionsFor.has(PermissionsBitField.Flags.UseExternalEmojis)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Use External Emojis in** <#" + interaction.channel.id + ">");
        if (!botPermissionsFor.has(PermissionsBitField.Flags.EmbedLinks)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Embed Links in** <#" + interaction.channel.id + ">");


        if (!subscription || !subscription.connection) return interaction.reply(client.emotes.error + " **I am not connected to a voice channel.**");

        if (!subscription.queue.length) return interaction.reply(client.emotes.error + " **Nothing is in the queue**, let's get this party started! :tada:");


        let repeatEmoji = "❌";
        let repeatTrackEmoji = "❌";
        if (subscription.queue.repeat === RepeatMode.QUEUE) repeatEmoji = "✅";
        else if (subscription.queue.repeat === RepeatMode.TRACK) repeatTrackEmoji = "✅";

        if (subscription.queue.length === 1) {
            const embed = new EmbedBuilder()
                .setColor("DarkGreen")
                .setAuthor({
                    name: "Queue for " + interaction.guild.name,
                    iconURL: interaction.guild.iconURL()
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

            interaction.reply({ embeds: [embed] });
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
                    name: "Queue for " + interaction.guild.name,
                    iconURL: interaction.guild.iconURL()
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

                interaction.reply({ embeds: [embed], components: [row] });

                const collector = interaction.channel.createMessageComponentCollector(
                    {
                        filter: x => x.user.id === interaction.user.id,
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
                        collector.stop();
                        i.update({ components: [] });
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
                    if (reason === "time") {
                        const newRow = new ActionRowBuilder(row);
                        newRow.components.forEach(x => x.setDisabled());

                        interaction.editReply({ components: [newRow] });
                    }
                });
            }
            else {
                interaction.reply({ embeds: [embed] });
            }
        }
    }
}