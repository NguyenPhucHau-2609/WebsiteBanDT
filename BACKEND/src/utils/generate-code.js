const { nanoid } = require("nanoid");

const generateCode = (prefix) => `${prefix}${nanoid(8).toUpperCase()}`;

module.exports = generateCode;
