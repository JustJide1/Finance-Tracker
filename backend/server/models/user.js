const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    firstName: { type: String, trim: true },
    lastName:  { type: String, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true },
    password:  { type: String },                                         // optional — Google-only accounts have no password
    googleId:  { type: String, sparse: true, unique: true },
    avatar:    { type: String },
    provider:  { type: String, enum: ["local", "google"], default: "local" },
    googleRefreshToken: { type: String, select: false },                 // stored AES-256-CBC encrypted
    flaggedAnomalyIds:  { type: [String], default: [] },
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
