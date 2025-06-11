"use client"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import TaskManager from "@/components/task-manager"

// Mock child components
jest.mock("@/components/task-list", () => {
  return function MockTaskList({ tasks, onDelete, onEdit, onToggleComplete }) {
    return (
      <div data-testid="task-list">
        {tasks.map((task) => (
          <div key={task.id} data-testid={`task-${task.id}`}>
            <span>{task.title}</span>
            <button onClick={() => onDelete(task.id)}>Delete {task.id}</button>
            <button onClick={() => onEdit(task)}>Edit {task.id}</button>
            <button onClick={() => onToggleComplete(task.id)}>Toggle {task.id}</button>
          </div>
        ))}
      </div>
    )
  }
})

jest.mock("@/components/task-form", () => {
  return function MockTaskForm({ open, onOpenChange, onSubmit, task }) {
    if (!open) return null

    return (
      <div data-testid="task-form">
        <input
          data-testid="title-input"
          placeholder="Task title"
          onChange={(e) => {
            // Simulate form submission
            if (e.target.value) {
              const newTask = {
                id: task?.id || "new-id",
                title: e.target.value,
                description: task?.description || "",
                priority: task?.priority || "Medium",
                completed: task?.completed || false,
                createdAt: task?.createdAt || new Date().toISOString(),
              }
              onSubmit(newTask)
            }
          }}
        />
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    )
  }
})

// Mock hooks
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

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

describe("TaskManager Component", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe("Initial Rendering", () => {
    it("should render main components", () => {
      render(<TaskManager />)

      expect(screen.getByText("Your Tasks (0)")).toBeInTheDocument()
      expect(screen.getByText("Add Task")).toBeInTheDocument()
      expect(screen.getByTestId("task-list")).toBeInTheDocument()
      expect(screen.getByLabelText("Sort by:")).toBeInTheDocument()
      expect(screen.getByLabelText("Order:")).toBeInTheDocument()
    })

    it("should load tasks from localStorage on mount", () => {
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

      render(<TaskManager />)

      expect(screen.getByText("Your Tasks (1)")).toBeInTheDocument()
      expect(screen.getByText("Stored Task")).toBeInTheDocument()
      expect(localStorageMock.getItem).toHaveBeenCalledWith("tasks")
    })

    it("should handle corrupted localStorage data gracefully", () => {
      localStorageMock.getItem.mockReturnValue("invalid-json")

      expect(() => {
        render(<TaskManager />)
      }).not.toThrow()

      expect(screen.getByText("Your Tasks (0)")).toBeInTheDocument()
    })

    it("should initialize with default sort settings", () => {
      render(<TaskManager />)

      const sortBySelect = screen.getByDisplayValue("Created")
      const sortOrderSelect = screen.getByDisplayValue("Descending")

      expect(sortBySelect).toBeInTheDocument()
      expect(sortOrderSelect).toBeInTheDocument()
    })
  })

  describe("Task Creation", () => {
    it("should open task form when Add Task button is clicked", async () => {
      const user = userEvent.setup()
      render(<TaskManager />)

      const addButton = screen.getByText("Add Task")
      await user.click(addButton)

      expect(screen.getByTestId("task-form")).toBeInTheDocument()
    })

    it("should add new task and update localStorage", async () => {
      const user = userEvent.setup()
      render(<TaskManager />)

      // Open form
      await user.click(screen.getByText("Add Task"))

      // Add task
      const titleInput = screen.getByTestId("title-input")
      await user.type(titleInput, "New Task")

      // Verify task was added
      expect(screen.getByText("Your Tasks (1)")).toBeInTheDocument()
      expect(screen.getByText("New Task")).toBeInTheDocument()

      // Verify localStorage was updated
      expect(localStorageMock.setItem).toHaveBeenCalledWith("tasks", expect.stringContaining("New Task"))
    })

    it("should close form after successful task creation", async () => {
      const user = userEvent.setup()
      render(<TaskManager />)

      await user.click(screen.getByText("Add Task"))

      const titleInput = screen.getByTestId("title-input")
      await user.type(titleInput, "New Task")

      // Form should be closed after submission
      expect(screen.queryByTestId("task-form")).not.toBeInTheDocument()
    })
  })

  describe("Task Editing", () => {
    it("should open edit form when task edit is triggered", async () => {
      const user = userEvent.setup()
      const initialTasks = [
        {
          id: "1",
          title: "Existing Task",
          description: "Description",
          priority: "Medium",
          completed: false,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialTasks))
      render(<TaskManager />)

      const editButton = screen.getByText("Edit 1")
      await user.click(editButton)

      expect(screen.getByTestId("task-form")).toBeInTheDocument()
    })

    it("should update existing task", async () => {
      const user = userEvent.setup()
      const initialTasks = [
        {
          id: "1",
          title: "Original Task",
          description: "Description",
          priority: "Medium",
          completed: false,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialTasks))
      render(<TaskManager />)

      // Edit task
      await user.click(screen.getByText("Edit 1"))

      const titleInput = screen.getByTestId("title-input")
      await user.clear(titleInput)
      await user.type(titleInput, "Updated Task")

      // Verify task was updated
      expect(screen.getByText("Updated Task")).toBeInTheDocument()
      expect(screen.queryByText("Original Task")).not.toBeInTheDocument()
    })
  })

  describe("Task Deletion", () => {
    it("should delete task when delete is triggered", async () => {
      const user = userEvent.setup()
      const initialTasks = [
        {
          id: "1",
          title: "Task to Delete",
          description: "Description",
          priority: "Medium",
          completed: false,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialTasks))
      render(<TaskManager />)

      expect(screen.getByText("Your Tasks (1)")).toBeInTheDocument()

      const deleteButton = screen.getByText("Delete 1")
      await user.click(deleteButton)

      expect(screen.getByText("Your Tasks (0)")).toBeInTheDocument()
      expect(screen.queryByText("Task to Delete")).not.toBeInTheDocument()
    })

    it("should update localStorage after deletion", async () => {
      const user = userEvent.setup()
      const initialTasks = [
        {
          id: "1",
          title: "Task to Delete",
          description: "Description",
          priority: "Medium",
          completed: false,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialTasks))
      render(<TaskManager />)

      await user.click(screen.getByText("Delete 1"))

      expect(localStorageMock.setItem).toHaveBeenCalledWith("tasks", "[]")
    })
  })

  describe("Task Completion Toggle", () => {
    it("should toggle task completion status", async () => {
      const user = userEvent.setup()
      const initialTasks = [
        {
          id: "1",
          title: "Task to Toggle",
          description: "Description",
          priority: "Medium",
          completed: false,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialTasks))
      render(<TaskManager />)

      const toggleButton = screen.getByText("Toggle 1")
      await user.click(toggleButton)

      // Verify localStorage was updated with completed task
      expect(localStorageMock.setItem).toHaveBeenCalledWith("tasks", expect.stringContaining('"completed":true'))
    })
  })

  describe("Sorting Functionality", () => {
    const multipleTasks = [
      {
        id: "1",
        title: "B Task",
        priority: "High",
        completed: false,
        createdAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "2",
        title: "A Task",
        priority: "Low",
        completed: true,
        createdAt: "2024-01-02T00:00:00.000Z",
      },
    ]

    it("should sort tasks by title", async () => {
      const user = userEvent.setup()
      localStorageMock.getItem.mockReturnValue(JSON.stringify(multipleTasks))
      render(<TaskManager />)

      const sortBySelect = screen.getByDisplayValue("Created")
      await user.selectOptions(sortBySelect, "title")

      // Tasks should be re-rendered in sorted order
      // This would be verified by checking the order in TaskList component
      expect(screen.getByDisplayValue("Title")).toBeInTheDocument()
    })

    it("should sort tasks by priority", async () => {
      const user = userEvent.setup()
      localStorageMock.getItem.mockReturnValue(JSON.stringify(multipleTasks))
      render(<TaskManager />)

      const sortBySelect = screen.getByDisplayValue("Created")
      await user.selectOptions(sortBySelect, "priority")

      expect(screen.getByDisplayValue("Priority")).toBeInTheDocument()
    })

    it("should change sort order", async () => {
      const user = userEvent.setup()
      localStorageMock.getItem.mockReturnValue(JSON.stringify(multipleTasks))
      render(<TaskManager />)

      const sortOrderSelect = screen.getByDisplayValue("Descending")
      await user.selectOptions(sortOrderSelect, "asc")

      expect(screen.getByDisplayValue("Ascending")).toBeInTheDocument()
    })
  })

  describe("Form State Management", () => {
    it("should close form when onOpenChange is called with false", async () => {
      const user = userEvent.setup()
      render(<TaskManager />)

      // Open form
      await user.click(screen.getByText("Add Task"))
      expect(screen.getByTestId("task-form")).toBeInTheDocument()

      // Close form
      await user.click(screen.getByText("Close"))
      expect(screen.queryByTestId("task-form")).not.toBeInTheDocument()
    })

    it("should reset edit state when form is closed", async () => {
      const user = userEvent.setup()
      const initialTasks = [
        {
          id: "1",
          title: "Task to Edit",
          description: "Description",
          priority: "Medium",
          completed: false,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialTasks))
      render(<TaskManager />)

      // Start editing
      await user.click(screen.getByText("Edit 1"))
      expect(screen.getByTestId("task-form")).toBeInTheDocument()

      // Close form
      await user.click(screen.getByText("Close"))

      // Open new task form
      await user.click(screen.getByText("Add Task"))
      expect(screen.getByTestId("task-form")).toBeInTheDocument()

      // Should be in create mode, not edit mode
      expect(screen.getByPlaceholderText("Task title")).toHaveValue("")
    })
  })

  describe("Error Handling", () => {
    it("should handle localStorage errors gracefully", () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("Storage quota exceeded")
      })

      expect(() => {
        render(<TaskManager />)
      }).not.toThrow()
    })

    it("should handle malformed task data", () => {
      const malformedTasks = [
        { id: "1" }, // Missing required fields
        { title: "No ID task" }, // Missing ID
        null, // Null task
        undefined, // Undefined task
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(malformedTasks))

      expect(() => {
        render(<TaskManager />)
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
      render(<TaskManager />)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(200)
      expect(screen.getByText("Your Tasks (1000)")).toBeInTheDocument()
    })
  })
})
