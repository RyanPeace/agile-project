"use client"

import { Check, Edit, Trash } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

function getPriorityVariant(priority) {
  switch (priority.toLowerCase()) {
    case "high":
      return "destructive"
    case "medium":
      return "default"
    case "low":
      return "secondary"
    default:
      return "outline"
  }
}

export default function TaskItem({ task, onDelete, onEdit, onToggleComplete }) {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Card className={task.completed ? "opacity-70" : ""}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className={`text-lg font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                {task.title}
              </h3>
              <Badge variant={getPriorityVariant(task.priority)}>{task.priority}</Badge>
              {task.completed && (
                <Badge variant="outline" className="bg-green-50">
                  Completed
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{task.description}</p>
          </div>
          <div className="text-sm text-muted-foreground">{formatDate(task.createdAt)}</div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 px-6 py-3">
        <div className="flex justify-between w-full">
          <Button variant="outline" size="sm" onClick={() => onToggleComplete(task.id)}>
            <Check className="mr-2 h-4 w-4" />
            {task.completed ? "Mark Incomplete" : "Mark Complete"}
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(task)}>
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Trash className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Task</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this task? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(task.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
