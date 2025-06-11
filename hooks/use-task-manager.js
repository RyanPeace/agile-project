"use client"

import { useState, useEffect, useCallback } from "react"
import { v4 as uuidv4 } from "uuid"
import { saveTasks, loadTasks } from "../utils/local-storage"
import { validateTask, sortTasks } from "../utils/task-utils"

/**
 * Custom hook for managing tasks with localStorage persistence
 * @param {Object} options - Configuration options
 * @returns {Object} Task management functions and state
 */
export function useTaskManager(options = {}) {
  const { autoSave = true, defaultSortBy = "created", defaultSortOrder = "desc" } = options

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState(defaultSortBy)
  const [sortOrder, setSortOrder] = useState(defaultSortOrder)

  // Load tasks from localStorage on mount
  useEffect(() => {
    try {
      const loadedTasks = loadTasks()
      setTasks(loadedTasks)
      setError(null)
    } catch (err) {
      setError("Failed to load tasks")
      console.error("Error loading tasks:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-save tasks when they change
  useEffect(() => {
    if (autoSave && !loading && tasks.length >= 0) {
      try {
        saveTasks(tasks)
        setError(null)
      } catch (err) {
        setError("Failed to save tasks")
        console.error("Error saving tasks:", err)
      }
    }
  }, [tasks, autoSave, loading])

  /**
   * Add a new task
   * @param {Object} taskData - Task data without id and createdAt
   * @returns {Object} Result with success status and task/error
   */
  const addTask = useCallback((taskData) => {
    try {
      const newTask = {
        id: uuidv4(),
        ...taskData,
        completed: false,
        createdAt: new Date().toISOString(),
      }

      const validation = validateTask(newTask)
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(", "),
        }
      }

      setTasks((prevTasks) => [...prevTasks, newTask])
      setError(null)

      return {
        success: true,
        task: newTask,
      }
    } catch (err) {
      const errorMessage = "Failed to add task"
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage,
      }
    }
  }, [])

  /**
   * Update an existing task
   * @param {string} taskId - Task ID
   * @param {Object} updates - Task updates
   * @returns {Object} Result with success status and task/error
   */
  const updateTask = useCallback((taskId, updates) => {
    try {
      let updatedTask = null

      setTasks((prevTasks) => {
        const taskIndex = prevTasks.findIndex((task) => task.id === taskId)

        if (taskIndex === -1) {
          throw new Error("Task not found")
        }

        updatedTask = { ...prevTasks[taskIndex], ...updates }

        const validation = validateTask(updatedTask)
        if (!validation.isValid) {
          throw new Error(validation.errors.join(", "))
        }

        const newTasks = [...prevTasks]
        newTasks[taskIndex] = updatedTask
        return newTasks
      })

      setError(null)
      return {
        success: true,
        task: updatedTask,
      }
    } catch (err) {
      const errorMessage = err.message || "Failed to update task"
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage,
      }
    }
  }, [])

  /**
   * Delete a task
   * @param {string} taskId - Task ID
   * @returns {Object} Result with success status and error if any
   */
  const deleteTask = useCallback((taskId) => {
    try {
      setTasks((prevTasks) => {
        const taskExists = prevTasks.some((task) => task.id === taskId)

        if (!taskExists) {
          throw new Error("Task not found")
        }

        return prevTasks.filter((task) => task.id !== taskId)
      })

      setError(null)
      return { success: true }
    } catch (err) {
      const errorMessage = err.message || "Failed to delete task"
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage,
      }
    }
  }, [])

  /**
   * Toggle task completion status
   * @param {string} taskId - Task ID
   * @returns {Object} Result with success status and task/error
   */
  const toggleTask = useCallback(
    (taskId) => {
      return updateTask(taskId, (prevTask) => ({
        completed: !prevTask.completed,
      }))
    },
    [updateTask],
  )

  /**
   * Clear all tasks
   * @returns {Object} Result with success status and error if any
   */
  const clearAllTasks = useCallback(() => {
    try {
      setTasks([])
      setError(null)
      return { success: true }
    } catch (err) {
      const errorMessage = "Failed to clear tasks"
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage,
      }
    }
  }, [])

  /**
   * Get sorted tasks
   * @returns {Array} Sorted tasks array
   */
  const getSortedTasks = useCallback(() => {
    return sortTasks(tasks, sortBy, sortOrder)
  }, [tasks, sortBy, sortOrder])

  /**
   * Update sorting configuration
   * @param {string} newSortBy - Sort criteria
   * @param {string} newSortOrder - Sort order
   */
  const updateSort = useCallback((newSortBy, newSortOrder) => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
  }, [])

  /**
   * Get task by ID
   * @param {string} taskId - Task ID
   * @returns {Object|null} Task object or null if not found
   */
  const getTaskById = useCallback(
    (taskId) => {
      return tasks.find((task) => task.id === taskId) || null
    },
    [tasks],
  )

  /**
   * Get tasks by completion status
   * @param {boolean} completed - Completion status
   * @returns {Array} Filtered tasks array
   */
  const getTasksByStatus = useCallback(
    (completed) => {
      return tasks.filter((task) => task.completed === completed)
    },
    [tasks],
  )

  /**
   * Get tasks by priority
   * @param {string} priority - Priority level
   * @returns {Array} Filtered tasks array
   */
  const getTasksByPriority = useCallback(
    (priority) => {
      return tasks.filter((task) => task.priority === priority)
    },
    [tasks],
  )

  return {
    // State
    tasks: getSortedTasks(),
    loading,
    error,
    sortBy,
    sortOrder,

    // Actions
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    clearAllTasks,
    updateSort,

    // Getters
    getTaskById,
    getTasksByStatus,
    getTasksByPriority,

    // Stats
    totalTasks: tasks.length,
    completedTasks: tasks.filter((task) => task.completed).length,
    pendingTasks: tasks.filter((task) => !task.completed).length,
  }
}
