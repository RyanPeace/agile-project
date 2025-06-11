import { sortTasks, formatDate, getPriorityVariant, validateTask } from "@/utils/task-utils"

describe("Task Utilities", () => {
  const mockTasks = [
    {
      id: "1",
      title: "High Priority Task",
      description: "Important task",
      priority: "High",
      completed: false,
      createdAt: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "2",
      title: "Medium Priority Task",
      description: "Normal task",
      priority: "Medium",
      completed: true,
      createdAt: "2024-01-02T00:00:00.000Z",
    },
    {
      id: "3",
      title: "Low Priority Task",
      description: "Less important task",
      priority: "Low",
      completed: false,
      createdAt: "2024-01-03T00:00:00.000Z",
    },
    {
      id: "4",
      title: "Another High Priority",
      description: "Another important task",
      priority: "High",
      completed: true,
      createdAt: "2024-01-04T00:00:00.000Z",
    },
  ]

  describe("sortTasks", () => {
    describe("Sort by Priority", () => {
      it("should sort by priority in descending order (High -> Medium -> Low)", () => {
        const sorted = sortTasks(mockTasks, "priority", "desc")

        expect(sorted[0].priority).toBe("High")
        expect(sorted[1].priority).toBe("High")
        expect(sorted[2].priority).toBe("Medium")
        expect(sorted[3].priority).toBe("Low")
      })

      it("should sort by priority in ascending order (Low -> Medium -> High)", () => {
        const sorted = sortTasks(mockTasks, "priority", "asc")

        expect(sorted[0].priority).toBe("Low")
        expect(sorted[1].priority).toBe("Medium")
        expect(sorted[2].priority).toBe("High")
        expect(sorted[3].priority).toBe("High")
      })
    })

    describe("Sort by Progress", () => {
      it("should sort by progress in descending order (incomplete first)", () => {
        const sorted = sortTasks(mockTasks, "progress", "desc")

        expect(sorted[0].completed).toBe(false)
        expect(sorted[1].completed).toBe(false)
        expect(sorted[2].completed).toBe(true)
        expect(sorted[3].completed).toBe(true)
      })

      it("should sort by progress in ascending order (completed first)", () => {
        const sorted = sortTasks(mockTasks, "progress", "asc")

        expect(sorted[0].completed).toBe(true)
        expect(sorted[1].completed).toBe(true)
        expect(sorted[2].completed).toBe(false)
        expect(sorted[3].completed).toBe(false)
      })
    })

    describe("Sort by Created Date", () => {
      it("should sort by creation date in descending order (newest first)", () => {
        const sorted = sortTasks(mockTasks, "created", "desc")

        expect(sorted[0].createdAt).toBe("2024-01-04T00:00:00.000Z")
        expect(sorted[1].createdAt).toBe("2024-01-03T00:00:00.000Z")
        expect(sorted[2].createdAt).toBe("2024-01-02T00:00:00.000Z")
        expect(sorted[3].createdAt).toBe("2024-01-01T00:00:00.000Z")
      })

      it("should sort by creation date in ascending order (oldest first)", () => {
        const sorted = sortTasks(mockTasks, "created", "asc")

        expect(sorted[0].createdAt).toBe("2024-01-01T00:00:00.000Z")
        expect(sorted[1].createdAt).toBe("2024-01-02T00:00:00.000Z")
        expect(sorted[2].createdAt).toBe("2024-01-03T00:00:00.000Z")
        expect(sorted[3].createdAt).toBe("2024-01-04T00:00:00.000Z")
      })
    })

    describe("Sort by Title", () => {
      it("should sort by title in ascending order (A-Z)", () => {
        const sorted = sortTasks(mockTasks, "title", "asc")

        expect(sorted[0].title).toBe("Another High Priority")
        expect(sorted[1].title).toBe("High Priority Task")
        expect(sorted[2].title).toBe("Low Priority Task")
        expect(sorted[3].title).toBe("Medium Priority Task")
      })

      it("should sort by title in descending order (Z-A)", () => {
        const sorted = sortTasks(mockTasks, "title", "desc")

        expect(sorted[0].title).toBe("Medium Priority Task")
        expect(sorted[1].title).toBe("Low Priority Task")
        expect(sorted[2].title).toBe("High Priority Task")
        expect(sorted[3].title).toBe("Another High Priority")
      })

      it("should handle case-insensitive sorting", () => {
        const tasksWithMixedCase = [
          { ...mockTasks[0], title: "apple" },
          { ...mockTasks[1], title: "Banana" },
          { ...mockTasks[2], title: "cherry" },
          { ...mockTasks[3], title: "Date" },
        ]

        const sorted = sortTasks(tasksWithMixedCase, "title", "asc")

        expect(sorted[0].title).toBe("apple")
        expect(sorted[1].title).toBe("Banana")
        expect(sorted[2].title).toBe("cherry")
        expect(sorted[3].title).toBe("Date")
      })
    })

    describe("Edge Cases", () => {
      it("should handle empty array", () => {
        const sorted = sortTasks([], "title", "asc")
        expect(sorted).toEqual([])
      })

      it("should handle single task", () => {
        const singleTask = [mockTasks[0]]
        const sorted = sortTasks(singleTask, "title", "asc")
        expect(sorted).toEqual(singleTask)
      })

      it("should not mutate original array", () => {
        const originalTasks = [...mockTasks]
        sortTasks(mockTasks, "title", "asc")
        expect(mockTasks).toEqual(originalTasks)
      })

      it("should handle unknown sort criteria", () => {
        const sorted = sortTasks(mockTasks, "unknown", "asc")
        expect(sorted).toEqual(mockTasks)
      })

      it("should handle tasks with missing properties", () => {
        const incompleteTasks = [
          { id: "1", title: "Task 1" },
          { id: "2", title: "Task 2", priority: "High" },
          { id: "3", title: "Task 3", completed: true },
        ]

        expect(() => {
          sortTasks(incompleteTasks, "priority", "asc")
        }).not.toThrow()
      })
    })
  })

  describe("formatDate", () => {
    it("should format ISO date string correctly", () => {
      const dateString = "2024-01-15T10:30:00.000Z"
      const formatted = formatDate(dateString)
      expect(formatted).toBe("Jan 15, 2024")
    })

    it("should handle different date formats", () => {
      const dateString = "2024-12-25T23:59:59.999Z"
      const formatted = formatDate(dateString)
      expect(formatted).toBe("Dec 25, 2024")
    })

    it("should handle invalid date strings", () => {
      const invalidDate = "invalid-date"
      const formatted = formatDate(invalidDate)
      expect(formatted).toBe("Invalid Date")
    })

    it("should handle null or undefined dates", () => {
      expect(formatDate(null)).toBe("Invalid Date")
      expect(formatDate(undefined)).toBe("Invalid Date")
    })

    it("should handle Date objects", () => {
      const date = new Date("2024-06-15T12:00:00.000Z")
      const formatted = formatDate(date.toISOString())
      expect(formatted).toBe("Jun 15, 2024")
    })
  })

  describe("getPriorityVariant", () => {
    it("should return destructive variant for High priority", () => {
      expect(getPriorityVariant("High")).toBe("destructive")
    })

    it("should return default variant for Medium priority", () => {
      expect(getPriorityVariant("Medium")).toBe("default")
    })

    it("should return secondary variant for Low priority", () => {
      expect(getPriorityVariant("Low")).toBe("secondary")
    })

    it("should handle case insensitive priority", () => {
      expect(getPriorityVariant("high")).toBe("destructive")
      expect(getPriorityVariant("MEDIUM")).toBe("default")
      expect(getPriorityVariant("low")).toBe("secondary")
    })

    it("should return outline variant for unknown priority", () => {
      expect(getPriorityVariant("Unknown")).toBe("outline")
      expect(getPriorityVariant("")).toBe("outline")
      expect(getPriorityVariant(null)).toBe("outline")
      expect(getPriorityVariant(undefined)).toBe("outline")
    })
  })

  describe("validateTask", () => {
    const validTask = {
      id: "1",
      title: "Valid Task",
      description: "Valid description",
      priority: "Medium",
      completed: false,
      createdAt: "2024-01-01T00:00:00.000Z",
    }

    it("should return no errors for valid task", () => {
      const errors = validateTask(validTask)
      expect(errors).toEqual({})
    })

    it("should return error for missing title", () => {
      const taskWithoutTitle = { ...validTask, title: "" }
      const errors = validateTask(taskWithoutTitle)
      expect(errors.title).toBe("Title is required")
    })

    it("should return error for whitespace-only title", () => {
      const taskWithWhitespaceTitle = { ...validTask, title: "   " }
      const errors = validateTask(taskWithWhitespaceTitle)
      expect(errors.title).toBe("Title is required")
    })

    it("should return error for title that is too long", () => {
      const taskWithLongTitle = { ...validTask, title: "A".repeat(201) }
      const errors = validateTask(taskWithLongTitle)
      expect(errors.title).toBe("Title must be 200 characters or less")
    })

    it("should return error for invalid priority", () => {
      const taskWithInvalidPriority = { ...validTask, priority: "Invalid" }
      const errors = validateTask(taskWithInvalidPriority)
      expect(errors.priority).toBe("Priority must be High, Medium, or Low")
    })

    it("should return error for description that is too long", () => {
      const taskWithLongDescription = { ...validTask, description: "A".repeat(1001) }
      const errors = validateTask(taskWithLongDescription)
      expect(errors.description).toBe("Description must be 1000 characters or less")
    })

    it("should return multiple errors for multiple invalid fields", () => {
      const invalidTask = {
        ...validTask,
        title: "",
        priority: "Invalid",
        description: "A".repeat(1001),
      }

      const errors = validateTask(invalidTask)
      expect(errors.title).toBe("Title is required")
      expect(errors.priority).toBe("Priority must be High, Medium, or Low")
      expect(errors.description).toBe("Description must be 1000 characters or less")
    })

    it("should handle null or undefined task", () => {
      expect(() => validateTask(null)).not.toThrow()
      expect(() => validateTask(undefined)).not.toThrow()

      const nullErrors = validateTask(null)
      const undefinedErrors = validateTask(undefined)

      expect(nullErrors.title).toBe("Title is required")
      expect(undefinedErrors.title).toBe("Title is required")
    })

    it("should allow empty description", () => {
      const taskWithEmptyDescription = { ...validTask, description: "" }
      const errors = validateTask(taskWithEmptyDescription)
      expect(errors.description).toBeUndefined()
    })

    it("should trim title before validation", () => {
      const taskWithWhitespace = { ...validTask, title: "  Valid Title  " }
      const errors = validateTask(taskWithWhitespace)
      expect(errors).toEqual({})
    })
  })
})
