import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import TaskItem from "@/components/task-item"

describe("TaskItem Component", () => {
  const mockTask = {
    id: "task-1",
    title: "Test Task",
    description: "Test task description",
    priority: "Medium",
    completed: false,
    createdAt: "2024-01-15T10:30:00.000Z",
  }

  const defaultProps = {
    task: mockTask,
    onDelete: jest.fn(),
    onEdit: jest.fn(),
    onToggleComplete: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Rendering", () => {
    it("should render task title and description", () => {
      render(<TaskItem {...defaultProps} />)

      expect(screen.getByText("Test Task")).toBeInTheDocument()
      expect(screen.getByText("Test task description")).toBeInTheDocument()
    })

    it("should render priority badge with correct variant", () => {
      render(<TaskItem {...defaultProps} />)

      const priorityBadge = screen.getByText("Medium")
      expect(priorityBadge).toBeInTheDocument()
      expect(priorityBadge).toHaveClass("bg-primary") // default variant
    })

    it("should render high priority with destructive variant", () => {
      const highPriorityTask = { ...mockTask, priority: "High" }
      render(<TaskItem {...defaultProps} task={highPriorityTask} />)

      const priorityBadge = screen.getByText("High")
      expect(priorityBadge).toHaveClass("bg-destructive")
    })

    it("should render low priority with secondary variant", () => {
      const lowPriorityTask = { ...mockTask, priority: "Low" }
      render(<TaskItem {...defaultProps} task={lowPriorityTask} />)

      const priorityBadge = screen.getByText("Low")
      expect(priorityBadge).toHaveClass("bg-secondary")
    })

    it("should render formatted creation date", () => {
      render(<TaskItem {...defaultProps} />)

      expect(screen.getByText("Jan 15, 2024")).toBeInTheDocument()
    })

    it("should render action buttons", () => {
      render(<TaskItem {...defaultProps} />)

      expect(screen.getByText("Mark Complete")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument()
    })
  })

  describe("Completed Task Rendering", () => {
    const completedTask = { ...mockTask, completed: true }

    it("should render completed task with reduced opacity", () => {
      render(<TaskItem {...defaultProps} task={completedTask} />)

      const card = screen.getByText("Test Task").closest(".opacity-70")
      expect(card).toBeInTheDocument()
    })

    it("should render title with line-through style", () => {
      render(<TaskItem {...defaultProps} task={completedTask} />)

      const title = screen.getByText("Test Task")
      expect(title).toHaveClass("line-through", "text-muted-foreground")
    })

    it("should show completed badge", () => {
      render(<TaskItem {...defaultProps} task={completedTask} />)

      expect(screen.getByText("Completed")).toBeInTheDocument()
    })

    it('should show "Mark Incomplete" button', () => {
      render(<TaskItem {...defaultProps} task={completedTask} />)

      expect(screen.getByText("Mark Incomplete")).toBeInTheDocument()
    })
  })

  describe("User Interactions", () => {
    it("should call onToggleComplete when toggle button is clicked", async () => {
      const user = userEvent.setup()
      render(<TaskItem {...defaultProps} />)

      const toggleButton = screen.getByText("Mark Complete")
      await user.click(toggleButton)

      expect(defaultProps.onToggleComplete).toHaveBeenCalledWith("task-1")
      expect(defaultProps.onToggleComplete).toHaveBeenCalledTimes(1)
    })

    it("should call onEdit when edit button is clicked", async () => {
      const user = userEvent.setup()
      render(<TaskItem {...defaultProps} />)

      const editButton = screen.getByRole("button", { name: /edit/i })
      await user.click(editButton)

      expect(defaultProps.onEdit).toHaveBeenCalledWith(mockTask)
      expect(defaultProps.onEdit).toHaveBeenCalledTimes(1)
    })

    it("should open delete confirmation dialog when delete button is clicked", async () => {
      const user = userEvent.setup()
      render(<TaskItem {...defaultProps} />)

      const deleteButton = screen.getByRole("button", { name: /delete/i })
      await user.click(deleteButton)

      expect(screen.getByText("Delete Task")).toBeInTheDocument()
      expect(
        screen.getByText("Are you sure you want to delete this task? This action cannot be undone."),
      ).toBeInTheDocument()
    })

    it("should call onDelete when delete is confirmed", async () => {
      const user = userEvent.setup()
      render(<TaskItem {...defaultProps} />)

      // Open delete dialog
      const deleteButton = screen.getByRole("button", { name: /delete/i })
      await user.click(deleteButton)

      // Confirm deletion
      const confirmButton = screen.getByRole("button", { name: "Delete" })
      await user.click(confirmButton)

      expect(defaultProps.onDelete).toHaveBeenCalledWith("task-1")
      expect(defaultProps.onDelete).toHaveBeenCalledTimes(1)
    })

    it("should not call onDelete when deletion is cancelled", async () => {
      const user = userEvent.setup()
      render(<TaskItem {...defaultProps} />)

      // Open delete dialog
      const deleteButton = screen.getByRole("button", { name: /delete/i })
      await user.click(deleteButton)

      // Cancel deletion
      const cancelButton = screen.getByText("Cancel")
      await user.click(cancelButton)

      expect(defaultProps.onDelete).not.toHaveBeenCalled()
    })
  })

  describe("Edge Cases", () => {
    it("should handle task without description", () => {
      const taskWithoutDescription = { ...mockTask, description: "" }
      render(<TaskItem {...defaultProps} task={taskWithoutDescription} />)

      expect(screen.getByText("Test Task")).toBeInTheDocument()
      expect(screen.queryByText("Test task description")).not.toBeInTheDocument()
    })

    it("should handle invalid date gracefully", () => {
      const taskWithInvalidDate = { ...mockTask, createdAt: "invalid-date" }
      render(<TaskItem {...defaultProps} task={taskWithInvalidDate} />)

      // Should not crash and should render some date representation
      expect(screen.getByText("Test Task")).toBeInTheDocument()
    })

    it("should handle unknown priority gracefully", () => {
      const taskWithUnknownPriority = { ...mockTask, priority: "Unknown" }
      render(<TaskItem {...defaultProps} task={taskWithUnknownPriority} />)

      const priorityBadge = screen.getByText("Unknown")
      expect(priorityBadge).toBeInTheDocument()
      expect(priorityBadge).toHaveClass("border") // outline variant
    })
  })

  describe("Accessibility", () => {
    it("should have proper button labels", () => {
      render(<TaskItem {...defaultProps} />)

      expect(screen.getByRole("button", { name: /mark complete/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument()
    })

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup()
      render(<TaskItem {...defaultProps} />)

      // Tab through buttons
      await user.tab()
      expect(screen.getByText("Mark Complete")).toHaveFocus()

      await user.tab()
      expect(screen.getByRole("button", { name: /edit/i })).toHaveFocus()

      await user.tab()
      expect(screen.getByRole("button", { name: /delete/i })).toHaveFocus()
    })

    it("should have proper ARIA attributes for completed tasks", () => {
      const completedTask = { ...mockTask, completed: true }
      render(<TaskItem {...defaultProps} task={completedTask} />)

      const title = screen.getByText("Test Task")
      expect(title).toHaveAttribute("aria-label", expect.stringContaining("completed"))
    })
  })

  describe("Performance", () => {
    it("should not re-render unnecessarily", () => {
      const renderSpy = jest.fn()
      const TestComponent = (props) => {
        renderSpy()
        return <TaskItem {...props} />
      }

      const { rerender } = render(<TestComponent {...defaultProps} />)

      // Re-render with same props
      rerender(<TestComponent {...defaultProps} />)

      // Should only render twice (initial + rerender)
      expect(renderSpy).toHaveBeenCalledTimes(2)
    })
  })
})
