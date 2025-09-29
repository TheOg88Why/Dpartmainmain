import fs from "fs/promises"
import path from "path"

async function createUserLogsDirectory() {
  try {
    const logsDir = path.join(process.cwd(), "logs")

    // Create logs directory if it doesn't exist
    try {
      await fs.access(logsDir)
      console.log("Logs directory already exists")
    } catch {
      await fs.mkdir(logsDir, { recursive: true })
      console.log("Created logs directory")
    }

    // Create users.txt file if it doesn't exist
    const usersFile = path.join(logsDir, "users.txt")
    try {
      await fs.access(usersFile)
      console.log("users.txt file already exists")
    } catch {
      await fs.writeFile(
        usersFile,
        "# User Activity Log\n# Format: timestamp | action | username | email | password_hash\n\n",
      )
      console.log("Created users.txt file")
    }

    console.log("User activity logging setup complete!")
  } catch (error) {
    console.error("Failed to setup user activity logging:", error)
  }
}

createUserLogsDirectory()
