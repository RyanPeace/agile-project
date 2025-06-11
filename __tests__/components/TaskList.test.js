"use client"
import { render, screen } from "@testing-library/react"
import TaskList from "@/components/task-list"

// Mock TaskItem component
jest.mock("@/components/task-item", () => {
  return function MockTaskItem({ task, onDelete, onEdit, onToggleComplete }) {
    return (
      <div data-testid={`task-item-${task.id}`}>
        <span>{task.title}</span>
        <button onClick={() => onDelete(task.id)}>Delete</button>
        <button onClick={() => onEdit(task)}>Edit</button>
        <button onClick={() => onToggleComplete(task.id)}>Toggle</button>
      </div>
    )
  }
})

describe("TaskList Component", () => {
  const mockTasks = [
    {
      id: "1",
      title: "Task 1",
      description: "Description 1",
      priority: "High",
      completed: false,
      createdAt: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "2",
      title: "Task 2",
      description: "Description 2",
      priority: "Medium",
      completed: true,
      createdAt: "2024-01-02T00:00:00.000Z",
    },
    {
      id: "3",
      title: "Task 3",
      description: "Description 3",
      priority: "Low",
      completed: false,
      createdAt: "2024-01-03T00:00:00.000Z",
    },
  ]

  const defaultProps = {
    tasks: mockTasks,
    onDelete: jest.fn(),
    onEdit: jest.fn(),
    onToggleComplete: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Rendering with Tasks", () => {
    it("should render all tasks when tasks array is provided", () => {
      render(<TaskList {...defaultProps} />)

      expect(screen.getByTestId("task-item-1")).toBeInTheDocument()
      expect(screen.getByTestId("task-item-2")).toBeInTheDocument()
      expect(screen.getByTestId("task-item-3")).toBeInTheDocument()

      expect(screen.getByText("Task 1")).toBeInTheDocument()
      expect(screen.getByText("Task 2")).toBeInTheDocument()
      expect(screen.getByText("Task 3")).toBeInTheDocument()
    })

    it("should pass correct props to TaskItem components", () => {
      render(<TaskList {...defaultProps} />)

      // Check that all required props are passed
      expect(screen.getAllByText("Delete")).toHaveLength(3)
      expect(screen.getAllByText("Edit")).toHaveLength(3)
      expect(screen.getAllByText("Toggle")).toHaveLength(3)
    })

    it("should render tasks in the order provided", () => {
      render(<TaskList {...defaultProps} />)

      const taskItems = screen.getAllByTestId(/task-item-/)
      expect(taskItems[0]).toHaveAttribute("data-testid", "task-item-1")
      expect(taskItems[1]).toHaveAttribute("data-testid", "task-item-2")
      expect(taskItems[2]).toHaveAttribute("data-testid", "task-item-3")
    })
  })

  describe("Empty State", () => {
    it("should render empty state when tasks array is empty", () => {
      render(<TaskList {...defaultProps} tasks={[]} />)

      expect(screen.getByText("No tasks yet. Add one to get started!")).toBeInTheDocument()
      expect(screen.queryByTestId(/task-item-/)).not.toBeInTheDocument()
    })

    it("should render empty state with proper styling", () => {
      render(<TaskList {...defaultProps} tasks={[]} />)

      const emptyState = screen.getByText("No tasks yet. Add one to get started!").closest("div")
      expect(emptyState).toHaveClass("text-center", "p-10", "border", "rounded-lg", "bg-muted/50")
    })

    it("should render empty state when tasks is undefined", () => {
      render(<TaskList {...defaultProps} tasks={undefined} />)

      expect(screen.getByText("No tasks yet. Add one to get started!")).toBeInTheDocument()
    })

    it("should render empty state when tasks is null", () => {
      render(<TaskList {...defaultProps} tasks={null} />)

      expect(screen.getByText("No tasks yet. Add one to get started!")).toBeInTheDocument()
    })
  })

  describe("Event Handling", () => {
    it("should call onDelete when TaskItem delete is triggered", () => {
      render(<TaskList {...defaultProps} />)

      const deleteButtons = screen.getAllByText("Delete")
      deleteButtons[0].click()

      expect(defaultProps.onDelete).toHaveBeenCalledWith("1")
      expect(defaultProps.onDelete).toHaveBeenCalledTimes(1)
    })

    it("should call onEdit when TaskItem edit is triggered", () => {
      render(<TaskList {...defaultProps} />)

      const editButtons = screen.getAllByText("Edit")
      editButtons[1].click()

      expect(defaultProps.onEdit).toHaveBeenCalledWith(mockTasks[1])
      expect(defaultProps.onEdit).toHaveBeenCalledTimes(1)
    })

    it("should call onToggleComplete when TaskItem toggle is triggered", () => {
      render(<TaskList {...defaultProps} />)

      const toggleButtons = screen.getAllByText("Toggle")
      toggleButtons[2].click()

      expect(defaultProps.onToggleComplete).toHaveBeenCalledWith("3")
      expect(defaultProps.onToggleComplete).toHaveBeenCalledTimes(1)
    })
  })

  describe("Performance", () => {
    it("should use proper keys for task items", () => {
      const { container } = render(<TaskList {...defaultProps} />)

      const taskItems = container.querySelectorAll('[data-testid^="task-item-"]')
      taskItems.forEach((item, index) => {
        expect(item).toHaveAttribute("data-testid", `task-item-${mockTasks[index].id}`)
      })
    })

    it("should handle large number of tasks efficiently", () => {
      const largeTasks = Array.from({ length: 1000 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
        description: `Description ${i}`,
        priority: "Medium",
        completed: false,
        createdAt: new Date().toISOString(),
      }))

      const startTime = performance.now()
      render(<TaskList {...defaultProps} tasks={largeTasks} />)
      const endTime = performance.now()

      // Should render within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100)

      // Should render all tasks
      expect(screen.getAllByTestId(/task-item-/)).toHaveLength(1000)
    })
  })

  describe("Accessibility", () => {
    it("should have proper semantic structure", () => {
      render(<TaskList {...defaultProps} />)

      const taskList = screen.getAllByTestId(/task-item-/)[0].parentElement
      expect(taskList).toHaveClass("space-y-4")
    })

    it("should be navigable with keyboard", () => {
      render(<TaskList {...defaultProps} />)

      const buttons = screen.getAllByRole("button")
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("tabIndex", "0")
      })
    })

    it("should have proper ARIA labels for empty state", () => {
      render(<TaskList {...defaultProps} tasks={[]} />)

      const emptyMessage = screen.getByText("No tasks yet. Add one to get started!")
      expect(emptyMessage).toHaveClass("text-muted-foreground")
    })
  })

  describe("Edge Cases", () => {
    it("should handle tasks with missing properties gracefully", () => {
      const incompleteTask = {
        id: "1",
        title: "Incomplete Task",
        // Missing other properties
      }

      expect(() => {
        render(<TaskList {...defaultProps} tasks={[incompleteTask]} />)
      }).not.toThrow()

      expect(screen.getByText("Incomplete Task")).toBeInTheDocument()
    })

    it("should handle duplicate task IDs gracefully", () => {
      const duplicateTasks = [
        { id: "1", title: "Task 1", priority: "High", completed: false, createdAt: "2024-01-01" },
        { id: "1", title: "Task 1 Duplicate", priority: "Low", completed: true, createdAt: "2024-01-02" },
      ]

      // Should render without crashing
      expect(() => {
        render(<TaskList {...defaultProps} tasks={duplicateTasks} />)
      }).not.toThrow()
    })

    it("should handle very long task titles", () => {
      const longTitleTask = {
        id: "1",
        title: "A".repeat(1000),
        description: "Description",
        priority: "Medium",
        completed: false,
        createdAt: "2024-01-01T00:00:00.000Z",
      }

      render(<TaskList {...defaultProps} tasks={[longTitleTask]} />)

      expect(screen.getByText("A".repeat(1000))).toBeInTheDocument()
    })
  })

  describe("Responsive Design", () => {
    it("should maintain proper spacing between tasks", () => {
      render(<TaskList {...defaultProps} />)

      const container = screen.getAllByTestId(/task-item-/)[0].parentElement
      expect(container).toHaveClass("space-y-4")
    })

    it("should handle single task correctly", () => {
      const singleTask = [mockTasks[0]]
      render(<TaskList {...defaultProps} tasks={singleTask} />)

      expect(screen.getByTestId("task-item-1")).toBeInTheDocument()
      expect(screen.getAllByTestId(/task-item-/)).toHaveLength(1)
    })
  })
})
