// Swap Mongoose's MongoDB driver for the D1 one before any model is compiled, then "open" the
// connection so models see readyState 1. Required first thing by app.js.
const mongoose = require("mongoose");
const d1Driver = require("./d1Driver");

mongoose.setDriver(d1Driver);
// Indexes are created by db/schema.sql; there is no server to build them or create collections.
mongoose.set("autoIndex", false);
mongoose.set("autoCreate", false);
mongoose.set("bufferCommands", false);

mongoose.connect("d1://database").catch((error) => {
    console.error("D1 connection setup failed:", error);
});

module.exports = mongoose;
