const express = require("express")
const { body, validationResult } = require("express-validator")
const User = require("../models/User")
const { auth } = require("../middleware/auth")

const router = express.Router()

// GET /api/profile - return current user's profile
router.get("/", auth, async (req, res) => {
  try {
    const user = req.user
    return res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        },
      },
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return res.status(500).json({ success: false, message: "Server error while fetching profile" })
  }
})

// PUT /api/profile - update username/email and optionally password
router.put(
  "/",
  auth,
  [
    body("username")
      .optional()
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be between 3 and 30 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage("Username can only contain letters, numbers, and underscores"),
    body("email").optional().isEmail().normalizeEmail().withMessage("Please enter a valid email"),
    body("newPassword").optional().isLength({ min: 6 }).withMessage("New password must be at least 6 characters long"),
    body("currentPassword").optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() })
      }

      const { username, email, currentPassword, newPassword } = req.body
      const user = await User.findById(req.user._id).select("+password")
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" })
      }

      // Handle username/email changes with uniqueness checks
      if (typeof username === "string" && username !== user.username) {
        const exists = await User.findOne({ username })
        if (exists) return res.status(400).json({ success: false, message: "Username already taken" })
        user.username = username
      }

      if (typeof email === "string" && email !== user.email) {
        const exists = await User.findOne({ email: email.toLowerCase() })
        if (exists) return res.status(400).json({ success: false, message: "Email already registered" })
        user.email = email.toLowerCase()
      }

      // Handle password change if requested
      if (newPassword) {
        // If user has a password (non-Google), require currentPassword to match
        if (user.password && !currentPassword) {
          return res.status(400).json({ success: false, message: "Current password is required" })
        }
        if (user.password && currentPassword) {
          const ok = await user.comparePassword(currentPassword)
          if (!ok) {
            return res.status(401).json({ success: false, message: "Current password is incorrect" })
          }
        }
        user.password = newPassword
      }

      await user.save()

      return res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
          },
        },
      })
    } catch (error) {
      console.error("Profile update error:", error)
      return res.status(500).json({ success: false, message: "Server error while updating profile" })
    }
  },
)

module.exports = router
