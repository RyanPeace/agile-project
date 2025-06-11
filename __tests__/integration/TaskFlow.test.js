import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import TaskManager from "@/components/task-manager"

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

// Mock toast
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

describe("Task Flow Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe("Complete Task Lifecycle", () => {
    it("should handle complete task creation, editing, completion, and deletion flow", async () => {
      const user = userEvent.setup()
      render(<TaskManager />)

      // Initial state - no tasks
      expect(screen.getByText("Your Tasks (0)")).toBeInTheDocument()

      // Step 1: Create a new task
      await user.click(screen.getByText("Add Task"))

      await user.type(screen.getByPlaceholderText("Task title"), "Integration Test Task")
      await user.type(screen.getByPlaceholderText("Task description"), "This is a test task for integration testing")

      // Select High priority
      await user.click(screen.getByRole("combobox"))
      await user.click(screen.getByText("High"))

      await user.click(screen.getByText("Create Task"))

      // Verify task was created
      await waitFor(() => {
        expect(screen.getByText("Your Tasks (1)")).toBeInTheDocument()
      })
      expect(screen.getByText("Integration Test Task")).toBeInTheDocument()
      expect(screen.getByText("This is a test task for integration testing")).toBeInTheDocument()
      expect(screen.getByText("High")).toBeInTheDocument()

      // Step 2: Edit the task
      await user.click(screen.getByLabelText("Edit task"))

      const titleInput = screen.getByDisplayValue("Integration Test Task")
      await user.clear(titleInput)
      await user.type(titleInput, "Updated Integration Test Task")

      await user.click(screen.getByText("Save Changes"))

      // Verify task was updated
      await waitFor(() => {
        expect(screen.getByText("Updated Integration Test Task")).toBeInTheDocument()
      })
      expect(screen.queryByText("Integration Test Task")).not.toBeInTheDocument()

      // Step 3: Mark task as complete
      await user.click(screen.getByText("Mark Complete"))

      // Verify task is marked as complete
      await waitFor(() => {
        expect(screen.getByText("Mark Incomplete")).toBeInTheDocument()
      })
      expect(screen.getByText("Completed")).toBeInTheDocument()

      // Step 4: Mark task as incomplete
      await user.click(screen.getByText("Mark Incomplete"))

      // Verify task is marked as incomplete
      await waitFor(() => {
        expect(screen.getByText("Mark Complete")).toBeInTheDocument()
      })
      expect(screen.queryByText("Completed")).not.toBeInTheDocument()

      // Step 5: Delete the task
      await user.click(screen.getByLabelText("Delete task"))
      await user.click(screen.getByText("Delete"))

      // Verify task was deleted
      await waitFor(() => {
        expect(screen.getByText("Your Tasks (0)")).toBeInTheDocument()
      })
      expect(screen.queryByText("Updated Integration Test Task")).not.toBeInTheDocument()
    })

    it("should persist tasks across browser sessions", async () => {
      const user = userEvent.setup()

      // First session - create tasks
      const { unmount } = render(<TaskManager />)

      await user.click(screen.getByText("Add Task"))
      await user.type(screen.getByPlaceholderText("Task title"), "Persistent Task 1")
      await user.click(screen.getByText("Create Task"))

      await waitFor(() => {
        expect(screen.getByText("Persistent Task 1")).toBeInTheDocument()
      })

      // Verify localStorage was called
      expect(localStorageMock.setItem).toHaveBeenCalledWith("tasks", expect.stringContaining("Persistent Task 1"))

      unmount()

      // Second session - simulate page reload
      const savedTasks = [
        {
          id: "1",
          title: "Persistent Task 1",
          description: "",
          priority: "Medium",
          completed: false,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      ]
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedTasks))

      render(<TaskManager />)

      // Verify task persisted
      expect(screen.getByText("Your Tasks (1)")).toBeInTheDocument()
      expect(screen.getByText("Persistent Task 1")).toBeInTheDocument()
    })
  })

  describe("Multiple Tasks Management", () => {
    it("should handle multiple tasks with different priorities and states", async () => {
      const user = userEvent.setup()
      render(<TaskManager />)

      // Create multiple tasks
      const tasks = [
        { title: "High Priority Task", priority: "High", description: "Urgent task" },
        { title: "Medium Priority Task", priority: "Medium", description: "Normal task" },
        { title: "Low Priority Task", priority: "Low", description: "Can wait" },
      ]

      for (const task of tasks) {
        await user.click(screen.getByText("Add Task"))
        await user.type(screen.getByPlaceholderText("Task title"), task.title)
        await user.type(screen.getByPlaceholderText("Task description"), task.description)

        await user.click(screen.getByRole("combobox"))
        await user.click(screen.getByText(task.priority))

        await user.click(screen.getByText("Create Task"))

        await waitFor(() => {
          expect(screen.getByText(task.title)).toBeInTheDocument()
        })
      }

      // Verify all tasks are displayed
      expect(screen.getByText("Your Tasks (3)")).toBeInTheDocument()
      expect(screen.getByText("High Priority Task")).toBeInTheDocument()
      expect(screen.getByText("Medium Priority Task")).toBeInTheDocument()
      expect(screen.getByText("Low Priority Task")).toBeInTheDocument()

      // Complete one task
      const completeButtons = screen.getAllByText("Mark Complete")
      await user.click(completeButtons[0])

      await waitFor(() => {
        expect(screen.getAllByText("Mark Complete")).toHaveLength(2)
        expect(screen.getByText("Mark Incomplete")).toBeInTheDocument()
      })

      // Delete one task
      const deleteButtons = screen.getAllByLabelText("Delete task")
      await user.click(deleteButtons[1])
      await user.click(screen.getByText("Delete"))

      await waitFor(() => {
        expect(screen.getByText("Your Tasks (2)")).toBeInTheDocument()
      })
    })
  })

  describe("Sorting and Filtering Integration", () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      const initialTasks = [
        {
          id: "1",
          title: "Alpha Task",
          description: "First alphabetically",
          priority: "High",
          completed: false,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "2",
          title: "Beta Task",
          description: "Second alphabetically",
          priority: "Low",
          completed: true,
          createdAt: "2024-01-02T00:00:00.000Z",
        },
        {
          id: "3",
          title: "Gamma Task",
          description: "Third alphabetically",
          priority: "Medium",
          completed: false,
          createdAt: "2024-01-03T00:00:00.000Z",
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialTasks))
    })

    it("should sort tasks by different criteria", async () => {
      const user = userEvent.setup()
      render(<TaskManager />)

      // Verify initial state (sorted by created date, descending)
      expect(screen.getByText("Your Tasks (3)")).toBeInTheDocument()

      // Sort by title
      await user.selectOptions(screen.getByDisplayValue("Created"), "title")

      // Verify sorting changed
      expect(screen.getByDisplayValue("Title")).toBeInTheDocument()

      // Sort by priority
      await user.selectOptions(screen.getByDisplayValue("Title"), "priority")

      expect(screen.getByDisplayValue("Priority")).toBeInTheDocument()

      // Change sort order
      await user.selectOptions(screen.getByDisplayValue("Descending"), "asc")

      expect(screen.getByDisplayValue("Ascending")).toBeInTheDocument()
    })

    it("should maintain sort settings when adding new tasks", async () => {
      const user = userEvent.setup()
      render(<TaskManager />)

      // Change sort to title ascending
      await user.selectOptions(screen.getByDisplayValue("Created"), "title")
      await user.selectOptions(screen.getByDisplayValue("Descending"), "asc")

      // Add new task
      await user.click(screen.getByText("Add Task"))
      await user.type(screen.getByPlaceholderText("Task title"), "Delta Task")
      await user.click(screen.getByText("Create Task"))

      await waitFor(() => {
        expect(screen.getByText("Your Tasks (4)")).toBeInTheDocument()
      })

      // Verify sort settings are maintained
      expect(screen.getByDisplayValue("Title")).toBeInTheDocument()
      expect(screen.getByDisplayValue("Ascending")).toBeInTheDocument()
    })
  })

  describe("Error Handling Integration", () => {
    it("should handle localStorage errors gracefully during task operations", async () => {
      const user = userEvent.setup()

      // Mock localStorage to throw error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("Storage quota exceeded")
      })

      render(<TaskManager />)

      // Should still allow task creation despite storage error
      await user.click(screen.getByText("Add Task"))
      await user.type(screen.getByPlaceholderText("Task title"), "Error Test Task")
      await user.click(screen.getByText("Create Task"))

      await waitFor(() => {
        expect(screen.getByText("Error Test Task")).toBeInTheDocument()
      })

      // Task should be in memory even if not persisted
      expect(screen.getByText("Your Tasks (1)")).toBeInTheDocument()
    })

    it("should handle form validation errors properly", async () => {
      const user = userEvent.setup()
      render(<TaskManager />)

      // Try to create task without title
      await user.click(screen.getByText("Add Task"))
      await user.click(screen.getByText("Create Task"))

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText("Title is required")).toBeInTheDocument()
      })

      // Should not create task
      expect(screen.getByText("Your Tasks (0)")).toBeInTheDocument()

      // Fix validation error
      await user.type(screen.getByPlaceholderText("Task title"), "Valid Task")
      await user.click(screen.getByText("Create Task"))

      // Should create task successfully
      await waitFor(() => {
        expect(screen.getByText("Valid Task")).toBeInTheDocument()
      })
      expect(screen.getByText("Your Tasks (1)")).toBeInTheDocument()
    })
  })

  describe("Performance Integration", () => {
    it("should handle rapid task operations efficiently", async () => {
      const user = userEvent.setup()
      render(<TaskManager />)

      const startTime = performance.now()

      // Rapidly create multiple tasks
      for (let i = 0; i < 10; i++) {
        await user.click(screen.getByText("Add Task"))
        await user.type(screen.getByPlaceholderText("Task title"), `Rapid Task ${i}`)
        await user.click(screen.getByText("Create Task"))
      }

      const endTime = performance.now()

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(5000)

      // All tasks should be created
      await waitFor(() => {
        expect(screen.getByText("Your Tasks (10)")).toBeInTheDocument()
      })
    })

    it("should handle large number of existing tasks efficiently", async () => {
      const largeTasks = Array.from({ length: 100 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
        description: `Description ${i}`,
        priority: i % 3 === 0 ? "High" : i % 3 === 1 ? "Medium" : "Low",
        completed: i % 4 === 0,
        createdAt: new Date(2024, 0, i + 1).toISOString(),
      }))

      localStorageMock.getItem.mockReturnValue(JSON.stringify(largeTasks))

      const startTime = performance.now()
      render(<TaskManager />)
      const endTime = performance.now()

      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(1000)

      // Should display correct count
      expect(screen.getByText("Your Tasks (100)")).toBeInTheDocument()
    })
  })

  describe("Accessibility Integration", () => {
    it("should support keyboard navigation through task operations", async () => {
      const user = userEvent.setup()
      render(<TaskManager />)

      // Create a task first
      await user.click(screen.getByText("Add Task"))
      await user.type(screen.getByPlaceholderText("Task title"), "Keyboard Test Task")
      await user.click(screen.getByText("Create Task"))

      await waitFor(() => {
        expect(screen.getByText("Keyboard Test Task")).toBeInTheDocument()
      })

      // Navigate through task actions with keyboard
      await user.tab() // Should focus on first interactive element
      await user.tab() // Navigate to next element
      await user.tab() // Continue navigation

      // Should be able to interact with focused elements
      const focusedElement = document.activeElement
      expect(focusedElement).toBeInstanceOf(HTMLElement)
      expect(focusedElement.tagName).toMatch(/BUTTON|SELECT|INPUT/)
    })

    it("should provide proper ARIA labels and descriptions", async () => {
      const user = userEvent.setup()
      render(<TaskManager />)

      // Check main heading
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Your Tasks (0)")

      // Check form labels
      await user.click(screen.getByText("Add Task"))

      expect(screen.getByLabelText("Title")).toBeInTheDocument()
      expect(screen.getByLabelText("Description")).toBeInTheDocument()
      expect(screen.getByLabelText("Priority")).toBeInTheDocument()

      // Check sorting controls
      expect(screen.getByLabelText("Sort by:")).toBeInTheDocument()
      expect(screen.getByLabelText("Order:")).toBeInTheDocument()
    })
  })
})
