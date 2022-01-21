const { ErrorCode } = require("../utils/constants");

class BaseError extends Error {
    /**
     * BaseError constructor
     * @param {ErrorCode} code 
     * @param {string} message 
     */
    constructor(code, message) {
        super();

        this.message = message;
        this.name = code;

        Error.captureStackTrace(this);
    }
}

module.exports = BaseError;