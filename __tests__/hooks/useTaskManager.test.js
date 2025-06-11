import { renderHook, act } from "@testing-library/react"
import { useTaskManager } from "@/hooks/use-task-manager"

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
})

// Mock uuid
jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-uuid-123"),
}))

describe("useTaskManager Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe("Initialization", () => {
    it("should initialize with empty tasks when localStorage is empty", () => {
      const { result } = renderHook(() => useTaskManager())

      expect(result.current.tasks).toEqual([])
      expect(localStorageMock.getItem).toHaveBeenCalledWith("tasks")
    })

    it("should load tasks from localStorage on initialization", () => {
      const storedTasks = [
        {
          id: "1",
          title: "Stored Task",
          description: "From localStorage",
          priority: "High",
          completed: false,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedTasks))

      const { result } = renderHook(() => useTaskManager())

      expect(result.current.tasks).toEqual(storedTasks)
    })

    it("should handle corrupted localStorage data gracefully", () => {
      localStorageMock.getItem.mockReturnValue("invalid-json")

      const { result } = renderHook(() => useTaskManager())

      expect(result.current.tasks).toEqual([])
    })

    it("should initialize with provided initial tasks", () => {
      const initialTasks = [
        {
          id: "1",
          title: "Initial Task",
          description: "Initial description",
          priority: "Medium",
          completed: false,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ]

      const { result } = renderHook(() => useTaskManager(initialTasks))

      expect(result.current.tasks).toEqual(initialTasks)
    })
  })

  describe("Adding Tasks", () => {
    it("should add a new task", () => {
      const { result } = renderHook(() => useTaskManager())

      const newTask = {
        title: "New Task",
        description: "New description",
        priority: "High",
      }

      act(() => {
        result.current.addTask(newTask)
      })

      expect(result.current.tasks).toHaveLength(1)
      expect(result.current.tasks[0]).toMatchObject({
        id: "mock-uuid-123",
        title: "New Task",
        description: "New description",
        priority: "High",
        completed: false,
        createdAt: expect.any(String),
      })
    })

    it("should save to localStorage when adding task", () => {
      const { result } = renderHook(() => useTaskManager())

      const newTask = {
        title: "New Task",
        description: "New description",
        priority: "High",
      }

      act(() => {
        result.current.addTask(newTask)
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith("tasks", expect.stringContaining("New Task"))
    })

    it("should generate unique IDs for multiple tasks", () => {
      const { v4: mockUuid } = require("uuid")
      mockUuid.mockReturnValueOnce("uuid-1").mockReturnValueOnce("uuid-2")

      const { result } = renderHook(() => useTaskManager())

      act(() => {
        result.current.addTask({ title: "Task 1", priority: "High" })
        result.current.addTask({ title: "Task 2", priority: "Medium" })
      })

      expect(result.current.tasks[0].id).toBe("uuid-1")
      expect(result.current.tasks[1].id).toBe("uuid-2")
    })

    it("should set default values for missing properties", () => {
      const { result } = renderHook(() => useTaskManager())

      act(() => {
        result.current.addTask({ title: "Minimal Task" })
      })

      const addedTask = result.current.tasks[0]
      expect(addedTask.description).toBe("")
      expect(addedTask.priority).toBe("Medium")
      expect(addedTask.completed).toBe(false)
      expect(addedTask.createdAt).toBeDefined()
    })
  })

  describe("Updating Tasks", () => {
    it("should update an existing task", () => {
      const initialTasks = [
        {
          id: "1",
          title: "Original Task",
          description: "Original description",
          priority: "Medium",
          completed: false,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialTasks))

      const { result } = renderHook(() => useTaskManager())

      const updates = {
        title: "Updated Task",
        priority: "High",
      }

      act(() => {
        result.current.updateTask("1", updates)
      })

      expect(result.current.tasks[0]).toMatchObject({
        id: "1",
        title: "Updated Task",
        description: "Original description",
        priority: "High",
        completed: false,
        createdAt: "2024-01-01T00:00:00.000Z",
      })
    })

    it("should save to localStorage when updating task", () => {
      const initialTasks = [
        {
          id: "1",
          title: "Original Task",
          description: "Original description",
          priority: "Medium",
          completed: false,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialTasks))

      const { result } = renderHook(() => useTaskManager())

      act(() => {
        result.current.updateTask("1", { title: "Updated Task" })
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith("tasks", expect.stringContaining("Updated Task"))
    })

    it("should not update non-existent task", () => {
      const initialTasks = [
        {
          id: "1",
          title: "Existing Task",
          priority: "Medium",
          completed: false,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialTasks))

      const { result } = renderHook(() => useTaskManager())

      act(() => {
        result.current.updateTask("non-existent", { title: "Updated" })
      })

      expect(result.current.tasks).toEqual(initialTasks)
    })

    it("should partially update task properties", () => {
      const initialTasks = [
        {
          id: "1",
          title: "Original Task",
          description: "Original description",
          priority: "Medium",
          completed: false,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialTasks))

      const { result } = renderHook(() => useTaskManager())

      act(() => {
        result.current.updateTask("1", { completed: true })
      })

      expect(result.current.tasks[0]).toMatchObject({
        id: "1",
        title: "Original Task",
        description: "Original description",
        priority: "Medium",
        completed: true,
        createdAt: "2024-01-01T00:00:00.000Z",
      })
    })
  })

  describe("Deleting Tasks", () => {
    it("should delete an existing task", () => {
      const initialTasks = [
        {
          id: "1",
          title: "Task 1",
          priority: "High",
          completed: false,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "2",
          title: "Task 2",
          priority: "Medium",
          completed: false,
          createdAt: "2024-01-02T00:00:00.000Z",
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialTasks))

      const { result } = renderHook(() => useTaskManager())

      act(() => {
        result.current.deleteTask("1")
      })

      expect(result.current.tasks).toHaveLength(1)
      expect(result.current.tasks[0].id).toBe("2")
    })

    it("should save to localStorage when deleting task", () => {
      const initialTasks = [
        {
          id: "1",
          title: "Task to Delete",
          priority: "High",
          completed: false,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialTasks))

      const { result } = renderHook(() => useTaskManager())

      act(() => {
        result.current.deleteTask("1")
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith("tasks", "[]")
    })

    it("should not affect tasks when deleting non-existent task", () => {
      const initialTasks = [
        {
          id: "1",
          title: "Existing Task",
          priority: "Medium",
          completed: false,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialTasks))

      const { result } = renderHook(() => useTaskManager())

      act(() => {
        result.current.deleteTask("non-existent")
      })

      expect(result.current.tasks).toEqual(initialTasks)
    })
  })

  describe("Toggle Completion", () => {
    it("should toggle task completion status", () => {
      const initialTasks = [
        {
          id: "1",
          title: "Task to Toggle",
          priority: "Medium",
          completed: false,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialTasks))

      const { result } = renderHook(() => useTaskManager())

      act(() => {
        result.current.toggleComplete("1")
      })

      expect(result.current.tasks[0].completed).toBe(true)

      act(() => {
        result.current.toggleComplete("1")
      })

      expect(result.current.tasks[0].completed).toBe(false)
    })

    it("should save to localStorage when toggling completion", () => {
      const initialTasks = [
        {
          id: "1",
          title: "Task to Toggle",
          priority: "Medium",
          completed: false,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialTasks))

      const { result } = renderHook(() => useTaskManager())

      act(() => {
        result.current.toggleComplete("1")
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith("tasks", expect.stringContaining('"completed":true'))
    })

    it("should not affect non-existent task when toggling", () => {
      const initialTasks = [
        {
          id: "1",
          title: "Existing Task",
          priority: "Medium",
          completed: false,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialTasks))

      const { result } = renderHook(() => useTaskManager())

      act(() => {
        result.current.toggleComplete("non-existent")
      })

      expect(result.current.tasks).toEqual(initialTasks)
    })
  })

  describe("Error Handling", () => {
    it("should handle localStorage errors gracefully", () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("Storage quota exceeded")
      })

      const { result } = renderHook(() => useTaskManager())

      expect(() => {
        act(() => {
          result.current.addTask({ title: "New Task", priority: "High" })
        })
      }).not.toThrow()

      // Task should still be added to state even if localStorage fails
      expect(result.current.tasks).toHaveLength(1)
    })

    it("should handle invalid task data gracefully", () => {
      const { result } = renderHook(() => useTaskManager())

      expect(() => {
        act(() => {
          result.current.addTask(null)
        })
      }).not.toThrow()

      expect(() => {
        act(() => {
          result.current.addTask(undefined)
        })
      }).not.toThrow()

      expect(() => {
        act(() => {
          result.current.addTask({})
        })
      }).not.toThrow()
    })
  })

  describe("Performance", () => {
    it("should handle large number of tasks efficiently", () => {
      const largeTasks = Array.from({ length: 1000 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
        description: `Description ${i}`,
        priority: "Medium",
        completed: false,
        createdAt: new Date().toISOString(),
      }))

      localStorageMock.getItem.mockReturnValue(JSON.stringify(largeTasks))

      const startTime = performance.now()
      const { result } = renderHook(() => useTaskManager())
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(50)
      expect(result.current.tasks).toHaveLength(1000)
    })

    it("should batch localStorage updates efficiently", () => {
      const { result } = renderHook(() => useTaskManager())

      act(() => {
        result.current.addTask({ title: "Task 1", priority: "High" })
        result.current.addTask({ title: "Task 2", priority: "Medium" })
        result.current.addTask({ title: "Task 3", priority: "Low" })
      })

      // Should have called setItem for each task addition
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(3)
    })
  })
})
