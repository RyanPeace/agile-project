/**
 * Task utility functions for sorting, validation, and formatting
 */

export const PRIORITY_ORDER = {
  High: 3,
  Medium: 2,
  Low: 1,
}

export const SORT_OPTIONS = {
  CREATED: "created",
  PRIORITY: "priority",
  PROGRESS: "progress",
  TITLE: "title",
}

export const SORT_ORDERS = {
  ASC: "asc",
  DESC: "desc",
}

/**
 * Sort tasks based on the specified criteria
 * @param {Array} tasks - Array of task objects
 * @param {string} sortBy - Sort criteria (created, priority, progress, title)
 * @param {string} sortOrder - Sort order (asc, desc)
 * @returns {Array} Sorted array of tasks
 */
export function sortTasks(tasks, sortBy = SORT_OPTIONS.CREATED, sortOrder = SORT_ORDERS.DESC) {
  if (!Array.isArray(tasks)) return []

  const sortedTasks = [...tasks].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case SORT_OPTIONS.CREATED:
        comparison = new Date(a.createdAt) - new Date(b.createdAt)
        break

      case SORT_OPTIONS.PRIORITY:
        comparison = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
        break

      case SORT_OPTIONS.PROGRESS:
        comparison = (a.completed ? 1 : 0) - (b.completed ? 1 : 0)
        break

      case SORT_OPTIONS.TITLE:
        comparison = a.title.toLowerCase().localeCompare(b.title.toLowerCase())
        break

      default:
        comparison = 0
    }

    return sortOrder === SORT_ORDERS.ASC ? comparison : -comparison
  })

  return sortedTasks
}

/**
 * Validate task object structure and required fields
 * @param {Object} task - Task object to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateTask(task) {
  const errors = []

  if (!task) {
    errors.push("Task object is required")
    return { isValid: false, errors }
  }

  if (!task.title || typeof task.title !== "string" || task.title.trim().length === 0) {
    errors.push("Title is required and must be a non-empty string")
  }

  if (task.title && task.title.length > 100) {
    errors.push("Title must be 100 characters or less")
  }

  if (task.description && typeof task.description !== "string") {
    errors.push("Description must be a string")
  }

  if (task.description && task.description.length > 500) {
    errors.push("Description must be 500 characters or less")
  }

  if (!task.priority || !["High", "Medium", "Low"].includes(task.priority)) {
    errors.push("Priority must be High, Medium, or Low")
  }

  if (typeof task.completed !== "boolean") {
    errors.push("Completed must be a boolean value")
  }

  if (task.createdAt && isNaN(new Date(task.createdAt))) {
    errors.push("CreatedAt must be a valid date")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  if (!date) return ""

  try {
    const dateObj = new Date(date)
    if (isNaN(dateObj)) return ""

    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch (error) {
    return ""
  }
}

/**
 * Get priority badge variant for styling
 * @param {string} priority - Task priority
 * @returns {string} Badge variant
 */
export function getPriorityVariant(priority) {
  switch (priority) {
    case "High":
      return "destructive"
    case "Medium":
      return "default"
    case "Low":
      return "secondary"
    default:
      return "default"
  }
}

/**
 * Filter tasks based on search criteria
 * @param {Array} tasks - Array of tasks
 * @param {string} searchTerm - Search term
 * @returns {Array} Filtered tasks
 */
export function filterTasks(tasks, searchTerm) {
  if (!searchTerm || !Array.isArray(tasks)) return tasks

  const term = searchTerm.toLowerCase().trim()

  return tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(term) || (task.description && task.description.toLowerCase().includes(term)),
  )
}

/**
 * Get task statistics
 * @param {Array} tasks - Array of tasks
 * @returns {Object} Task statistics
 */
export function getTaskStats(tasks) {
  if (!Array.isArray(tasks)) {
    return {
      total: 0,
      completed: 0,
      pending: 0,
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0,
      completionRate: 0,
    }
  }

  const stats = tasks.reduce(
    (acc, task) => {
      acc.total++

      if (task.completed) {
        acc.completed++
      } else {
        acc.pending++
      }

      switch (task.priority) {
        case "High":
          acc.highPriority++
          break
        case "Medium":
          acc.mediumPriority++
          break
        case "Low":
          acc.lowPriority++
          break
      }

      return acc
    },
    {
      total: 0,
      completed: 0,
      pending: 0,
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0,
    },
  )

  stats.completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0

  return stats
}
