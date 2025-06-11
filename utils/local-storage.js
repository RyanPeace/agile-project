/**
 * Local storage utility functions with error handling
 */

const STORAGE_KEY = "tasks"

/**
 * Save tasks to localStorage
 * @param {Array} tasks - Array of task objects
 * @returns {boolean} Success status
 */
export function saveTasks(tasks) {
  try {
    if (!Array.isArray(tasks)) {
      console.error("saveTasks: tasks must be an array")
      return false
    }

    const serializedTasks = JSON.stringify(tasks)
    localStorage.setItem(STORAGE_KEY, serializedTasks)
    return true
  } catch (error) {
    console.error("Error saving tasks to localStorage:", error)
    return false
  }
}

/**
 * Load tasks from localStorage
 * @returns {Array} Array of task objects or empty array
 */
export function loadTasks() {
  try {
    const serializedTasks = localStorage.getItem(STORAGE_KEY)

    if (!serializedTasks) {
      return []
    }

    const tasks = JSON.parse(serializedTasks)

    if (!Array.isArray(tasks)) {
      console.warn("loadTasks: stored data is not an array, returning empty array")
      return []
    }

    return tasks
  } catch (error) {
    console.error("Error loading tasks from localStorage:", error)
    return []
  }
}

/**
 * Clear all tasks from localStorage
 * @returns {boolean} Success status
 */
export function clearTasks() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (error) {
    console.error("Error clearing tasks from localStorage:", error)
    return false
  }
}

/**
 * Check if localStorage is available
 * @returns {boolean} Availability status
 */
export function isLocalStorageAvailable() {
  try {
    const testKey = "__localStorage_test__"
    localStorage.setItem(testKey, "test")
    localStorage.removeItem(testKey)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Get localStorage usage information
 * @returns {Object} Storage usage stats
 */
export function getStorageInfo() {
  try {
    const tasks = loadTasks()
    const serializedTasks = JSON.stringify(tasks)

    return {
      taskCount: tasks.length,
      storageSize: new Blob([serializedTasks]).size,
      isAvailable: isLocalStorageAvailable(),
    }
  } catch (error) {
    return {
      taskCount: 0,
      storageSize: 0,
      isAvailable: false,
      error: error.message,
    }
  }
}

/**
 * Backup tasks to a downloadable file
 * @param {Array} tasks - Tasks to backup
 * @returns {string} Download URL
 */
export function backupTasks(tasks) {
  try {
    const dataStr = JSON.stringify(tasks, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    return URL.createObjectURL(dataBlob)
  } catch (error) {
    console.error("Error creating backup:", error)
    return null
  }
}

/**
 * Restore tasks from a backup file
 * @param {File} file - Backup file
 * @returns {Promise<Array>} Promise resolving to tasks array
 */
export function restoreTasks(file) {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const tasks = JSON.parse(event.target.result)

          if (!Array.isArray(tasks)) {
            reject(new Error("Invalid backup file format"))
            return
          }

          resolve(tasks)
        } catch (parseError) {
          reject(new Error("Failed to parse backup file"))
        }
      }

      reader.onerror = () => {
        reject(new Error("Failed to read backup file"))
      }

      reader.readAsText(file)
    } catch (error) {
      reject(error)
    }
  })
}
