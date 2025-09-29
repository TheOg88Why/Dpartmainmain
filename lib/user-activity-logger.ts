import bcrypt from "bcryptjs"

interface UserActivity {
  username: string
  email: string
  passwordHash: string
  timestamp: string
  action: "login" | "register"
}

export async function logUserActivity(username: string, email: string, password: string, action: "login" | "register") {
  try {
    // Hash the password for security
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    const activity: UserActivity = {
      username,
      email,
      passwordHash,
      timestamp: new Date().toISOString(),
      action,
    }

    const logEntry = `${activity.timestamp} | ${activity.action.toUpperCase()} | ${activity.username} | ${activity.email} | ${activity.passwordHash}\n`

    // In a real application, you would write to a file or database
    // For now, we'll use the browser's localStorage as a demo
    if (typeof window !== "undefined") {
      const existingLogs = localStorage.getItem("user_activity_logs") || ""
      localStorage.setItem("user_activity_logs", existingLogs + logEntry)
    }

    // In a server environment, you would write to a file:
    // await fs.appendFile("logs/users.txt", logEntry)

    console.log("[v0] User activity logged:", { username, email, action, timestamp: activity.timestamp })
  } catch (error) {
    console.error("[v0] Failed to log user activity:", error)
  }
}
