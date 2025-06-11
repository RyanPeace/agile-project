"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import TaskList from "@/components/task-list"
import TaskForm from "@/components/task-form"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function TaskManager() {
  const [tasks, setTasks] = useState([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState(null)
  const { toast } = useToast()
  const [sortBy, setSortBy] = useState("created")
  const [sortOrder, setSortOrder] = useState("desc")

  // Load tasks from localStorage on component mount
  useEffect(() => {
    const storedTasks = localStorage.getItem("tasks")
    if (storedTasks) {
      try {
        setTasks(JSON.parse(storedTasks))
      } catch (error) {
        console.error("Failed to parse tasks from localStorage:", error)
        setTasks([])
      }
    }
  }, [])

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks))
  }, [tasks])

  const handleAddTask = (task) => {
    setTasks((prevTasks) => [...prevTasks, task])
    setIsFormOpen(false)
    toast({
      title: "Task created",
      description: "Your task has been created successfully.",
    })
  }

  const handleUpdateTask = (updatedTask) => {
    setTasks((prevTasks) => prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)))
    setTaskToEdit(null)
    toast({
      title: "Task updated",
      description: "Your task has been updated successfully.",
    })
  }

  const handleDeleteTask = (id) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id))
    toast({
      title: "Task deleted",
      description: "Your task has been deleted successfully.",
      variant: "destructive",
    })
  }

  const handleToggleComplete = (id) => {
    setTasks((prevTasks) => prevTasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))
  }

  const handleEditTask = (task) => {
    setTaskToEdit(task)
  }

  const sortTasks = (tasks) => {
    return [...tasks].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "priority":
          const priorityOrder = { High: 3, Medium: 2, Low: 1 }
          comparison = priorityOrder[b.priority] - priorityOrder[a.priority]
          break
        case "progress":
          comparison = a.completed === b.completed ? 0 : a.completed ? 1 : -1
          break
        case "created":
          comparison = new Date(b.createdAt) - new Date(a.createdAt)
          break
        case "title":
          comparison = a.title.localeCompare(b.title)
          break
        default:
          comparison = 0
      }

      return sortOrder === "asc" ? comparison : -comparison
    })
  }

  const sortedTasks = sortTasks(tasks)

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Your Tasks ({tasks.length})</h2>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Task
          </Button>
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <Label htmlFor="sort-by">Sort by:</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger id="sort-by" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="sort-order">Order:</Label>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger id="sort-order" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <TaskList
        tasks={sortedTasks}
        onDelete={handleDeleteTask}
        onEdit={handleEditTask}
        onToggleComplete={handleToggleComplete}
      />

      <TaskForm
        open={isFormOpen || taskToEdit !== null}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) setTaskToEdit(null)
        }}
        onSubmit={taskToEdit ? handleUpdateTask : handleAddTask}
        task={taskToEdit}
      />
    </div>
  )
}
