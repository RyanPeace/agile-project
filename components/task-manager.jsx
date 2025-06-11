"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import TaskList from "@/components/task-list"
import TaskForm from "@/components/task-form"

export default function TaskManager() {
  const [tasks, setTasks] = useState([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState(null)
  const { toast } = useToast()

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Tasks ({tasks.length})</h2>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </div>

      <TaskList
        tasks={tasks}
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
