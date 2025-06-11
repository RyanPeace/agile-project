import { saveToStorage, loadFromStorage, clearStorage } from "@/utils/local-storage"

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

describe("localStorage Utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.error = jest.fn() // Mock console.error to test error handling
  })

  describe("saveToStorage", () => {
    it("should save data to localStorage with correct key", () => {
      const testData = { id: "1", name: "Test" }

      saveToStorage("test-key", testData)

      expect(localStorageMock.setItem).toHaveBeenCalledWith("test-key", JSON.stringify(testData))
    })

    it("should handle complex nested objects", () => {
      const complexData = {
        tasks: [
          {
            id: "1",
            title: "Task 1",
            metadata: {
              tags: ["work", "urgent"],
              assignee: { name: "John", id: 123 },
            },
          },
        ],
        settings: {
          theme: "dark",
          notifications: true,
        },
      }

      saveToStorage("complex-data", complexData)

      expect(localStorageMock.setItem).toHaveBeenCalledWith("complex-data", JSON.stringify(complexData))
    })

    it("should handle null and undefined values", () => {
      saveToStorage("null-key", null)
      saveToStorage("undefined-key", undefined)

      expect(localStorageMock.setItem).toHaveBeenCalledWith("null-key", "null")
      expect(localStorageMock.setItem).toHaveBeenCalledWith("undefined-key", "null")
    })

    it("should handle localStorage errors gracefully", () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("Storage quota exceeded")
      })

      expect(() => {
        saveToStorage("test-key", { data: "test" })
      }).not.toThrow()

      expect(console.error).toHaveBeenCalledWith("Error saving to localStorage:", expect.any(Error))
    })

    it("should handle circular references", () => {
      const circularData = { name: "test" }
      circularData.self = circularData

      expect(() => {
        saveToStorage("circular-key", circularData)
      }).not.toThrow()

      expect(console.error).toHaveBeenCalledWith("Error saving to localStorage:", expect.any(Error))
    })
  })

  describe("loadFromStorage", () => {
    it("should load and parse data from localStorage", () => {
      const testData = { id: "1", name: "Test" }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(testData))

      const result = loadFromStorage("test-key")

      expect(localStorageMock.getItem).toHaveBeenCalledWith("test-key")
      expect(result).toEqual(testData)
    })

    it("should return default value when key does not exist", () => {
      localStorageMock.getItem.mockReturnValue(null)

      const result = loadFromStorage("non-existent-key", { default: "value" })

      expect(result).toEqual({ default: "value" })
    })

    it("should return default value when localStorage is empty", () => {
      localStorageMock.getItem.mockReturnValue("")

      const result = loadFromStorage("empty-key", [])

      expect(result).toEqual([])
    })

    it("should handle malformed JSON gracefully", () => {
      localStorageMock.getItem.mockReturnValue("invalid-json{")

      const result = loadFromStorage("malformed-key", { fallback: true })

      expect(result).toEqual({ fallback: true })
      expect(console.error).toHaveBeenCalledWith("Error loading from localStorage:", expect.any(Error))
    })

    it("should handle localStorage access errors", () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error("localStorage not available")
      })

      const result = loadFromStorage("error-key", "default")

      expect(result).toBe("default")
      expect(console.error).toHaveBeenCalledWith("Error loading from localStorage:", expect.any(Error))
    })

    it("should handle complex nested objects", () => {
      const complexData = {
        tasks: [
          {
            id: "1",
            title: "Task 1",
            metadata: {
              tags: ["work", "urgent"],
              assignee: { name: "John", id: 123 },
            },
          },
        ],
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(complexData))

      const result = loadFromStorage("complex-key")

      expect(result).toEqual(complexData)
    })

    it("should preserve data types correctly", () => {
      const typedData = {
        string: "hello",
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: "value" },
        nullValue: null,
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(typedData))

      const result = loadFromStorage("typed-key")

      expect(result).toEqual(typedData)
      expect(typeof result.string).toBe("string")
      expect(typeof result.number).toBe("number")
      expect(typeof result.boolean).toBe("boolean")
      expect(Array.isArray(result.array)).toBe(true)
      expect(typeof result.object).toBe("object")
      expect(result.nullValue).toBeNull()
    })
  })

  describe("clearStorage", () => {
    it("should remove specific key from localStorage", () => {
      clearStorage("specific-key")

      expect(localStorageMock.removeItem).toHaveBeenCalledWith("specific-key")
    })

    it("should clear all localStorage when no key provided", () => {
      clearStorage()

      expect(localStorageMock.clear).toHaveBeenCalled()
    })

    it("should handle localStorage errors when removing specific key", () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error("Cannot remove item")
      })

      expect(() => {
        clearStorage("error-key")
      }).not.toThrow()

      expect(console.error).toHaveBeenCalledWith("Error clearing localStorage:", expect.any(Error))
    })

    it("should handle localStorage errors when clearing all", () => {
      localStorageMock.clear.mockImplementation(() => {
        throw new Error("Cannot clear storage")
      })

      expect(() => {
        clearStorage()
      }).not.toThrow()

      expect(console.error).toHaveBeenCalledWith("Error clearing localStorage:", expect.any(Error))
    })
  })

  describe("Edge Cases and Browser Compatibility", () => {
    it("should handle when localStorage is not available", () => {
      // Temporarily remove localStorage
      const originalLocalStorage = window.localStorage
      delete window.localStorage

      expect(() => {
        saveToStorage("test", { data: "test" })
        loadFromStorage("test", "default")
        clearStorage("test")
      }).not.toThrow()

      // Restore localStorage
      window.localStorage = originalLocalStorage
    })

    it("should handle private browsing mode restrictions", () => {
      localStorageMock.setItem.mockImplementation(() => {
        const error = new Error("QuotaExceededError")
        error.name = "QuotaExceededError"
        throw error
      })

      expect(() => {
        saveToStorage("private-test", { data: "test" })
      }).not.toThrow()

      expect(console.error).toHaveBeenCalled()
    })

    it("should handle storage quota exceeded", () => {
      localStorageMock.setItem.mockImplementation(() => {
        const error = new Error("Storage quota exceeded")
        error.name = "QuotaExceededError"
        throw error
      })

      const largeData = { data: "x".repeat(10000000) } // Large data

      expect(() => {
        saveToStorage("large-data", largeData)
      }).not.toThrow()

      expect(console.error).toHaveBeenCalledWith("Error saving to localStorage:", expect.any(Error))
    })
  })

  describe("Performance", () => {
    it("should handle large datasets efficiently", () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        title: `Item ${i}`,
        data: `Data for item ${i}`,
      }))

      const startTime = performance.now()
      saveToStorage("large-dataset", largeDataset)
      const saveEndTime = performance.now()

      localStorageMock.getItem.mockReturnValue(JSON.stringify(largeDataset))

      const loadStartTime = performance.now()
      const result = loadFromStorage("large-dataset")
      const loadEndTime = performance.now()

      expect(saveEndTime - startTime).toBeLessThan(100)
      expect(loadEndTime - loadStartTime).toBeLessThan(100)
      expect(result).toHaveLength(10000)
    })

    it("should handle frequent save operations efficiently", () => {
      const startTime = performance.now()

      for (let i = 0; i < 100; i++) {
        saveToStorage(`key-${i}`, { id: i, data: `Data ${i}` })
      }

      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(200)
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(100)
    })
  })
})
