import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import TaskForm from "@/components/task-form"

// Mock uuid
jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-uuid-123"),
}))

describe("TaskForm Component", () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onSubmit: jest.fn(),
    task: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Rendering", () => {
    it("should render create task dialog when task is null", () => {
      render(<TaskForm {...defaultProps} />)

      expect(screen.getByText("Create New Task")).toBeInTheDocument()
      expect(screen.getByText("Add the details for your new task.")).toBeInTheDocument()
      expect(screen.getByPlaceholderText("Task title")).toBeInTheDocument()
      expect(screen.getByPlaceholderText("Task description")).toBeInTheDocument()
      expect(screen.getByText("Create Task")).toBeInTheDocument()
    })

    it("should render edit task dialog when task is provided", () => {
      const task = {
        id: "1",
        title: "Test Task",
        description: "Test Description",
        priority: "High",
        completed: false,
        createdAt: "2024-01-01T00:00:00.000Z",
      }

      render(<TaskForm {...defaultProps} task={task} />)

      expect(screen.getByText("Edit Task")).toBeInTheDocument()
      expect(screen.getByText("Make changes to your task here.")).toBeInTheDocument()
      expect(screen.getByDisplayValue("Test Task")).toBeInTheDocument()
      expect(screen.getByDisplayValue("Test Description")).toBeInTheDocument()
      expect(screen.getByText("Save Changes")).toBeInTheDocument()
    })

    it("should not render dialog when open is false", () => {
      render(<TaskForm {...defaultProps} open={false} />)

      expect(screen.queryByText("Create New Task")).not.toBeInTheDocument()
    })

    it("should render all priority options", () => {
      render(<TaskForm {...defaultProps} />)

      const prioritySelect = screen.getByRole("combobox")
      fireEvent.click(prioritySelect)

      expect(screen.getByText("Low")).toBeInTheDocument()
      expect(screen.getByText("Medium")).toBeInTheDocument()
      expect(screen.getByText("High")).toBeInTheDocument()
    })
  })

  describe("Form Validation", () => {
    it("should show error when title is empty", async () => {
      const user = userEvent.setup()
      render(<TaskForm {...defaultProps} />)

      const submitButton = screen.getByText("Create Task")
      await user.click(submitButton)

      expect(screen.getByText("Title is required")).toBeInTheDocument()
      expect(defaultProps.onSubmit).not.toHaveBeenCalled()
    })

    it("should show error when title is only whitespace", async () => {
      const user = userEvent.setup()
      render(<TaskForm {...defaultProps} />)

      const titleInput = screen.getByPlaceholderText("Task title")
      await user.type(titleInput, "   ")

      const submitButton = screen.getByText("Create Task")
      await user.click(submitButton)

      expect(screen.getByText("Title is required")).toBeInTheDocument()
      expect(defaultProps.onSubmit).not.toHaveBeenCalled()
    })

    it("should not show error when title is provided", async () => {
      const user = userEvent.setup()
      render(<TaskForm {...defaultProps} />)

      const titleInput = screen.getByPlaceholderText("Task title")
      await user.type(titleInput, "Valid Title")

      const submitButton = screen.getByText("Create Task")
      await user.click(submitButton)

      expect(screen.queryByText("Title is required")).not.toBeInTheDocument()
      expect(defaultProps.onSubmit).toHaveBeenCalled()
    })

    it("should clear errors when form is reset", async () => {
      const user = userEvent.setup()
      const { rerender } = render(<TaskForm {...defaultProps} />)

      // Trigger validation error
      const submitButton = screen.getByText("Create Task")
      await user.click(submitButton)
      expect(screen.getByText("Title is required")).toBeInTheDocument()

      // Close and reopen dialog
      rerender(<TaskForm {...defaultProps} open={false} />)
      rerender(<TaskForm {...defaultProps} open={true} />)

      expect(screen.queryByText("Title is required")).not.toBeInTheDocument()
    })
  })

  describe("Form Submission", () => {
    it("should submit new task with correct data", async () => {
      const user = userEvent.setup()
      render(<TaskForm {...defaultProps} />)

      const titleInput = screen.getByPlaceholderText("Task title")
      const descriptionInput = screen.getByPlaceholderText("Task description")

      await user.type(titleInput, "New Task")
      await user.type(descriptionInput, "New Description")

      // Select High priority
      const prioritySelect = screen.getByRole("combobox")
      await user.click(prioritySelect)
      await user.click(screen.getByText("High"))

      const submitButton = screen.getByText("Create Task")
      await user.click(submitButton)

      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        id: "mock-uuid-123",
        title: "New Task",
        description: "New Description",
        priority: "High",
        completed: false,
        createdAt: expect.any(String),
      })

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
    })

    it("should submit updated task with existing ID", async () => {
      const user = userEvent.setup()
      const existingTask = {
        id: "existing-id",
        title: "Existing Task",
        description: "Existing Description",
        priority: "Medium",
        completed: true,
        createdAt: "2024-01-01T00:00:00.000Z",
      }

      render(<TaskForm {...defaultProps} task={existingTask} />)

      const titleInput = screen.getByDisplayValue("Existing Task")
      await user.clear(titleInput)
      await user.type(titleInput, "Updated Task")

      const submitButton = screen.getByText("Save Changes")
      await user.click(submitButton)

      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        id: "existing-id",
        title: "Updated Task",
        description: "Existing Description",
        priority: "Medium",
        completed: true,
        createdAt: "2024-01-01T00:00:00.000Z",
      })
    })

    it("should trim whitespace from title", async () => {
      const user = userEvent.setup()
      render(<TaskForm {...defaultProps} />)

      const titleInput = screen.getByPlaceholderText("Task title")
      await user.type(titleInput, "  Trimmed Title  ")

      const submitButton = screen.getByText("Create Task")
      await user.click(submitButton)

      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Trimmed Title",
        }),
      )
    })
  })

  describe("Form Reset", () => {
    it("should reset form when dialog closes", () => {
      const { rerender } = render(<TaskForm {...defaultProps} />)

      // Fill form
      const titleInput = screen.getByPlaceholderText("Task title")
      fireEvent.change(titleInput, { target: { value: "Test Title" } })

      // Close dialog
      rerender(<TaskForm {...defaultProps} open={false} />)

      // Reopen dialog
      rerender(<TaskForm {...defaultProps} open={true} />)

      expect(screen.getByPlaceholderText("Task title")).toHaveValue("")
    })

    it("should reset form when task changes", () => {
      const task1 = {
        id: "1",
        title: "Task 1",
        description: "Description 1",
        priority: "High",
        completed: false,
        createdAt: "2024-01-01T00:00:00.000Z",
      }

      const task2 = {
        id: "2",
        title: "Task 2",
        description: "Description 2",
        priority: "Low",
        completed: false,
        createdAt: "2024-01-02T00:00:00.000Z",
      }

      const { rerender } = render(<TaskForm {...defaultProps} task={task1} />)

      expect(screen.getByDisplayValue("Task 1")).toBeInTheDocument()

      rerender(<TaskForm {...defaultProps} task={task2} />)

      expect(screen.getByDisplayValue("Task 2")).toBeInTheDocument()
      expect(screen.queryByDisplayValue("Task 1")).not.toBeInTheDocument()
    })
  })

  describe("Cancel Functionality", () => {
    it("should call onOpenChange when cancel button is clicked", async () => {
      const user = userEvent.setup()
      render(<TaskForm {...defaultProps} />)

      const cancelButton = screen.getByText("Cancel")
      await user.click(cancelButton)

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
    })

    it("should not submit form when cancel is clicked", async () => {
      const user = userEvent.setup()
      render(<TaskForm {...defaultProps} />)

      const titleInput = screen.getByPlaceholderText("Task title")
      await user.type(titleInput, "Test Title")

      const cancelButton = screen.getByText("Cancel")
      await user.click(cancelButton)

      expect(defaultProps.onSubmit).not.toHaveBeenCalled()
    })
  })

  describe("Accessibility", () => {
    it("should have proper form labels", () => {
      render(<TaskForm {...defaultProps} />)

      expect(screen.getByLabelText("Title")).toBeInTheDocument()
      expect(screen.getByLabelText("Description")).toBeInTheDocument()
      expect(screen.getByLabelText("Priority")).toBeInTheDocument()
    })

    it("should associate error messages with inputs", async () => {
      const user = userEvent.setup()
      render(<TaskForm {...defaultProps} />)

      const submitButton = screen.getByText("Create Task")
      await user.click(submitButton)

      const titleInput = screen.getByPlaceholderText("Task title")
      const errorMessage = screen.getByText("Title is required")

      expect(titleInput).toHaveAttribute("aria-describedby")
      expect(errorMessage).toHaveAttribute("id")
    })

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup()
      render(<TaskForm {...defaultProps} />)

      // Tab through form elements
      await user.tab()
      expect(screen.getByPlaceholderText("Task title")).toHaveFocus()

      await user.tab()
      expect(screen.getByPlaceholderText("Task description")).toHaveFocus()

      await user.tab()
      expect(screen.getByRole("combobox")).toHaveFocus()
    })
  })
})
