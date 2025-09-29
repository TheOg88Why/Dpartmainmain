const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
require("dotenv").config()

const authRoutes = require("./routes/auth")
const serverRoutes = require("./routes/servers")
const profileRoutes = require("./routes/profile")
const { errorHandler, notFound } = require("./middleware/errorHandler")

const app = express()

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
)

// Rate limiting
const limiter = rateLimit({
  windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: Math.ceil((Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use(limiter)

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error("Database connection error:", error.message)
    process.exit(1)
  }
}

// Connect to database
connectDB()

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "AuraDeploy API is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  })
})

// Redirect root to health check
app.get("/", (req, res) => {
  res.redirect("/api/health")
})

// API routes
app.use("/api/auth", authRoutes)
app.use("/api/servers", serverRoutes)
app.use("/api/profile", profileRoutes)

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

const server = app.listen(PORT, () => {
  console.log(`AuraDeploy API server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`)
  console.log(`Health check: http://localhost:${PORT}/api/health`)
})

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...")
  server.close(() => {
    console.log("Process terminated")
    mongoose.connection.close()
  })
})

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...")
  server.close(() => {
    console.log("Process terminated")
    mongoose.connection.close()
  })
})

module.exports = app
