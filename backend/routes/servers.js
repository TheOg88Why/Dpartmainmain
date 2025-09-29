const express = require("express")
const { body, validationResult } = require("express-validator")
const Server = require("../models/Server")
const { auth } = require("../middleware/auth")

const router = express.Router()

// All routes are protected
router.use(auth)

// @route   GET /api/servers
// @desc    Get all servers for the authenticated user
// @access  Private
router.get("/", async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const servers = await Server.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("owner", "username email")

    const total = await Server.countDocuments({ owner: req.user._id })

    res.json({
      success: true,
      data: {
        servers,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
    })
  } catch (error) {
    console.error("Get servers error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching servers",
    })
  }
})

// @route   GET /api/servers/:id
// @desc    Get a specific server
// @access  Private
router.get("/:id", async (req, res) => {
  try {
    const server = await Server.findOne({
      _id: req.params.id,
      owner: req.user._id,
    }).populate("owner", "username email")

    if (!server) {
      return res.status(404).json({
        success: false,
        message: "Server not found",
      })
    }

    res.json({
      success: true,
      data: { server },
    })
  } catch (error) {
    console.error("Get server error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching server",
    })
  }
})

// @route   POST /api/servers
// @desc    Create a new server
// @access  Private
router.post(
  "/",
  [
    body("name").isLength({ min: 3, max: 50 }).withMessage("Server name must be between 3 and 50 characters").trim(),
    body("description")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Description cannot exceed 500 characters")
      .trim(),
    body("version")
      .optional()
      .matches(/^\d+\.\d+(\.\d+)?$/)
      .withMessage("Version must be in format X.Y or X.Y.Z"),
    body("type")
      .optional()
      .isIn(["vanilla", "forge", "fabric", "paper", "spigot", "bukkit"])
      .withMessage("Invalid server type"),
    body("maxPlayers").optional().isInt({ min: 1, max: 100 }).withMessage("Max players must be between 1 and 100"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      // Check server limit (mock limit of 5 servers per user)
      const serverCount = await Server.countDocuments({ owner: req.user._id })
      if (serverCount >= 5) {
        return res.status(400).json({
          success: false,
          message: "Server limit reached. Maximum 5 servers per user.",
        })
      }

      // Generate a mock port (in production, this would be managed by your infrastructure)
      const port = 25565 + Math.floor(Math.random() * 1000)

      const server = new Server({
        ...req.body,
        owner: req.user._id,
        port,
        ipAddress: `server-${Date.now()}.auradeploy.com`, // Mock IP
      })

      await server.save()
      await server.populate("owner", "username email")

      res.status(201).json({
        success: true,
        message: "Server created successfully",
        data: { server },
      })
    } catch (error) {
      console.error("Create server error:", error)
      res.status(500).json({
        success: false,
        message: "Server error while creating server",
      })
    }
  },
)

// @route   PUT /api/servers/:id/toggle
// @desc    Toggle server status (start/stop)
// @access  Private
router.put("/:id/toggle", async (req, res) => {
  try {
    const server = await Server.findOne({
      _id: req.params.id,
      owner: req.user._id,
    })

    if (!server) {
      return res.status(404).json({
        success: false,
        message: "Server not found",
      })
    }

    // Mock server status toggle logic
    let newStatus
    if (server.status === "stopped") {
      newStatus = "starting"
      server.lastStarted = new Date()

      // Simulate startup process
      setTimeout(async () => {
        try {
          await Server.findByIdAndUpdate(server._id, { status: "running" })
        } catch (err) {
          console.error("Error updating server status:", err)
        }
      }, 3000)
    } else if (server.status === "running") {
      newStatus = "stopping"
      server.lastStopped = new Date()

      // Simulate shutdown process
      setTimeout(async () => {
        try {
          await Server.findByIdAndUpdate(server._id, { status: "stopped" })
        } catch (err) {
          console.error("Error updating server status:", err)
        }
      }, 2000)
    } else {
      return res.status(400).json({
        success: false,
        message: "Server is currently transitioning. Please wait.",
      })
    }

    server.status = newStatus
    await server.save()

    res.json({
      success: true,
      message: `Server ${newStatus === "starting" ? "starting" : "stopping"}`,
      data: { server },
    })
  } catch (error) {
    console.error("Toggle server error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while toggling server status",
    })
  }
})

// @route   PUT /api/servers/:id
// @desc    Update server settings
// @access  Private
router.put(
  "/:id",
  [
    body("name")
      .optional()
      .isLength({ min: 3, max: 50 })
      .withMessage("Server name must be between 3 and 50 characters")
      .trim(),
    body("description")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Description cannot exceed 500 characters")
      .trim(),
    body("maxPlayers").optional().isInt({ min: 1, max: 100 }).withMessage("Max players must be between 1 and 100"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const server = await Server.findOneAndUpdate(
        { _id: req.params.id, owner: req.user._id },
        { ...req.body },
        { new: true, runValidators: true },
      ).populate("owner", "username email")

      if (!server) {
        return res.status(404).json({
          success: false,
          message: "Server not found",
        })
      }

      res.json({
        success: true,
        message: "Server updated successfully",
        data: { server },
      })
    } catch (error) {
      console.error("Update server error:", error)
      res.status(500).json({
        success: false,
        message: "Server error while updating server",
      })
    }
  },
)

// @route   DELETE /api/servers/:id
// @desc    Delete a server
// @access  Private
router.delete("/:id", async (req, res) => {
  try {
    const server = await Server.findOne({
      _id: req.params.id,
      owner: req.user._id,
    })

    if (!server) {
      return res.status(404).json({
        success: false,
        message: "Server not found",
      })
    }

    // Check if server is running
    if (server.status === "running") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a running server. Please stop it first.",
      })
    }

    await Server.findByIdAndDelete(server._id)

    res.json({
      success: true,
      message: "Server deleted successfully",
    })
  } catch (error) {
    console.error("Delete server error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while deleting server",
    })
  }
})

module.exports = router
