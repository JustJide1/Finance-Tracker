const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            // Pool sizing: 20 connections handles 50-100 concurrent users comfortably.
            // Each dashboard request holds at most 2 concurrent connections (find + aggregate),
            // so 20 connections supports ~10 simultaneous dashboard loads before queuing.
            // Set MONGO_POOL_SIZE in .env to tune without a code change.
            maxPoolSize:              parseInt(process.env.MONGO_POOL_SIZE ?? "20", 10),
            minPoolSize:              5,

            // Fail fast instead of hanging for 30 s when the server is unreachable.
            serverSelectionTimeoutMS: 5_000,

            // Kill idle sockets that MongoDB's TCP stack has already dropped.
            socketTimeoutMS:          45_000,

            // Limit how long the initial connection handshake may take.
            connectTimeoutMS:         10_000,
        });
        console.log("MongoDB connected");
    } catch (err) {
        console.error("MongoDB connection failed:", err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
