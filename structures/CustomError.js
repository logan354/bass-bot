const { ErrorCode } = require("../utils/constants");

class CustomError extends Error {
    /**
     * Error handler constructor
     * @param {ErrorCode} code 
     * @param {string} message 
     */
    constructor(code, message) {
        super();

        this.message = message;
        this.name = "[" + code + "]";
    }
}

module.exports = { CustomError }