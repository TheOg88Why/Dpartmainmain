const mongoose = require("mongoose")

const serverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Server name is required"],
    trim: true,
    minlength: [3, "Server name must be at least 3 characters long"],
    maxlength: [50, "Server name cannot exceed 50 characters"],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, "Description cannot exceed 500 characters"],
  },
  version: {
    type: String,
    required: [true, "Minecraft version is required"],
    default: "1.20.4",
  },
  type: {
    type: String,
    enum: ["vanilla", "forge", "fabric", "paper", "spigot", "bukkit"],
    default: "vanilla",
  },
  status: {
    type: String,
    enum: ["stopped", "starting", "running", "stopping", "error"],
    default: "stopped",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  maxPlayers: {
    type: Number,
    min: [1, "Max players must be at least 1"],
    max: [100, "Max players cannot exceed 100"],
    default: 20,
  },
  port: {
    type: Number,
    min: [25565, "Port must be at least 25565"],
    max: [65535, "Port cannot exceed 65535"],
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  ipAddress: {
    type: String,
    default: null,
  },
  lastStarted: {
    type: Date,
  },
  lastStopped: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Update updatedAt field before saving
serverSchema.pre("save", function (next) {
  this.updatedAt = Date.now()
  next()
})

// Index for better query performance
serverSchema.index({ owner: 1, createdAt: -1 })
serverSchema.index({ status: 1 })

module.exports = mongoose.model("Server", serverSchema)
