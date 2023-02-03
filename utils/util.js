const { Client, ApplicationCommand } = require("discord.js");

/**
 * Gets a slash commands mention
 * @param {Client} client
 * @param {string} name 
 * @returns {ApplicationCommand.id}
 */
async function getApplicationCommandID(client, name) {
    const commands = await client.application.commands.fetch();
    for (let command of commands) {
        if (command[1].name === name) {
            return command[1].id;
        }
    }
}

module.exports = { getApplicationCommandID }