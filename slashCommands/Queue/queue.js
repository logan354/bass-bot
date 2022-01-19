const { Client, CommandInteraction, CommandInteractionOptionResolver, Permissions, MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");

const { formatChunk, formatDuration } = require("../../utils/formats");

module.exports = {
    name: "queue",
    category: "Queue",
    description: "Shows all currently enqueued songs",

    /**
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     * @param {CommandInteractionOptionResolver} args 
     */
    async execute(client, interaction, args) {
        const serverQueue = client.queues.get(interaction.guild.id);

        const botPermissionsFor = interaction.channel.permissionsFor(interaction.guild.me);
        if (!botPermissionsFor.has(Permissions.FLAGS.USE_EXTERNAL_EMOJIS)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Use External Emojis in** " + "`" + interaction.channel.name + "`");
        if (!botPermissionsFor.has(Permissions.FLAGS.EMBED_LINKS)) return interaction.reply(client.emotes.permissionError + " **I do not have permission to Embed Links in** " + "`" + interaction.channel.name + "`");

        if (!interaction.guild.me.voice.channel) return interaction.reply(client.emotes.error + " **I am not connected to a voice channel.** Type " + "`" + client.config.app.prefix + "join" + "`" + " to get me in one");

        if (!serverQueue.tracks.length) return interaction.reply(client.emotes.error + " **Nothing playing in this server**, let's get this party started! :tada:");

        const loopEmoji = serverQueue.loop ? "✅" : "❌";
        const loopQueueEmoji = serverQueue.loopQueue ? "✅" : "❌";

        if (serverQueue.tracks.length === 1) {
            const embed = new MessageEmbed()
                .setColor("BLACK")
                .setAuthor({
                    name: "Queue for " + interaction.guild.name,
                    iconURL: client.emotes.player
                })
                .setDescription("__**Now Playing**__\n" + `[${serverQueue.tracks[0].title}](${serverQueue.tracks[0].url})\n` + "`" + serverQueue.tracks[0].durationFormatted + "` **|** Requested by: <@" + serverQueue.tracks[0].requestedBy + ">")
                .addField("Voice Channel", `<#${serverQueue.voiceChannel.id}>`, true)
                .setFooter({
                    text: "Page 1/1" + " | Loop: " + loopEmoji + " | Queue Loop: " + loopQueueEmoji,
                    iconURL: interaction.user.displayAvatarURL()
                });

            interaction.reply({ embeds: [embed] });
        } else {
            const queue = serverQueue.tracks.map((track, i) => "`" + i + ".` " + `[${track.title}](${track.url})\n` + "`" + track.durationFormatted + "` **|** Requested by: <@" + track.requestedBy + ">").slice(1, serverQueue.tracks.length);
            const pages = formatChunk(queue, 5).map((x) => x.join("\n\n"));
            let currentPage = 1;

            // Total Duration of all tracks
            let totalDuration = 0;
            for (let i = 0; i < serverQueue.tracks.length; i++) {
                totalDuration += serverQueue.tracks[i].duration;
            }

            const embed = new MessageEmbed()
                .setColor("BLACK")
                .setAuthor({
                    name: "Queue for " + interaction.guild.name,
                    iconURL: client.emotes.player
                })
                .setDescription("__**Now Playing**__\n" + `[${serverQueue.tracks[0].title}](${serverQueue.tracks[0].url})\n` + "`" + serverQueue.tracks[0].durationFormatted + "` **|** Requested by: <@" + serverQueue.tracks[0].requestedBy + ">" + "\n\n__**Up Next**__\n" + pages[currentPage - 1])
                .setFields(
                    {
                        name: "Total songs:",
                        value: "`" + (serverQueue.tracks.length - 1) + "`",
                        inline: true
                    },
                    {
                        name: "Total Length:",
                        value: "`" + formatDuration(totalDuration - serverQueue.tracks[0].duration) + "`",
                        inline: true
                    },
                    {
                        name: "Voice Channel",
                        value: `<#${serverQueue.voiceChannel.id}>`,
                        inline: true
                    }

                )
                .setFooter({
                    text: "Page 1/" + pages.length + " | Loop: " + loopEmoji + " | Queue Loop: " + loopQueueEmoji,
                    iconURL: interaction.user.displayAvatarURL()
                });


            if (pages.length > 1) {
                const random_num = new Date().getTime();

                const button1 = new MessageButton()
                    .setCustomId("queue_previous_page" + `_active${random_num}`)
                    .setEmoji("⬅️")
                    .setStyle("PRIMARY");

                const button2 = new MessageButton()
                    .setCustomId("queue_stop" + `_active${random_num}`)
                    .setEmoji("⏹️")
                    .setStyle("DANGER");

                const button3 = new MessageButton()
                    .setCustomId("queue_next_page" + `_active${random_num}`)
                    .setEmoji("➡️")
                    .setStyle("PRIMARY");

                const row = new MessageActionRow()
                    .addComponents(
                        [
                            button1,
                            button2,
                            button3
                        ]
                    );

                interaction.reply({ embeds: [embed], components: [row] });

                const collector = interaction.channel.createMessageComponentCollector(
                    {
                        time: 60000,
                        errors: ["time", "user"],
                        filter: x => x.user.id === interaction.user.id
                    }
                );

                collector.on("collect", async (_interaction) => {
                    if (!_interaction.isButton()) return;

                    if (_interaction.customId === "queue_next_page" + `_active${random_num}`) {
                        await _interaction.deferUpdate();

                        if (currentPage < pages.length) {
                            currentPage++;
                            const newEmbed = new MessageEmbed(embed)
                                .setDescription("__**Now Playing**__\n" + `[${serverQueue.tracks[0].title}](${serverQueue.tracks[0].url})\n` + "`" + serverQueue.tracks[0].durationFormatted + "` **|** Requested by: <@" + serverQueue.tracks[0].requestedBy + ">" + "\n\n__**Up Next**__\n" + pages[currentPage - 1])
                                .setFooter({
                                    text: "Page " + currentPage + "/" + pages.length + " | Loop: " + loopEmoji + " | Queue Loop: " + loopQueueEmoji,
                                    iconURL: interaction.user.displayAvatarURL()
                                });

                            interaction.editReply({ embeds: [newEmbed], components: [row] });
                        }
                    } else if (_interaction.customId === "queue_previous_page" + `_active${random_num}`) {
                        await _interaction.deferUpdate();

                        if (currentPage > 1) {
                            currentPage--;
                            const newEmbed = new MessageEmbed(embed)
                                .setDescription("__**Now Playing**__\n" + `[${serverQueue.tracks[0].title}](${serverQueue.tracks[0].url})\n` + "`" + serverQueue.tracks[0].durationFormatted + "` **|** Requested by: <@" + serverQueue.tracks[0].requestedBy + ">" + "\n\n__**Up Next**__\n" + pages[currentPage - 1])
                                .setFooter({
                                    text: "Page " + currentPage + "/" + pages.length + " | Loop: " + loopEmoji + " | Queue Loop: " + loopQueueEmoji,
                                    iconURL: interaction.user.displayAvatarURL()
                                });

                            interaction.editReply({ embeds: [newEmbed], components: [row] });
                        }
                    } else if (_interaction.customId === "queue_stop" + `_active${random_num}`) {
                        await _interaction.deferUpdate();

                        collector.stop();
                    } else return;
                });

                collector.on("end", (collection, reason) => {
                    if (reason === "time" || "user") {
                        interaction.editReply({ components: [] });
                    }
                });
            } else {
                interaction.reply({ embeds: [embed] });
            }
        }
    }
}