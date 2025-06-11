import TaskItem from "@/components/task-item"

export default function TaskList({ tasks, onDelete, onEdit, onToggleComplete }) {
  if (tasks.length === 0) {
    return (
      <div className="text-center p-10 border rounded-lg bg-muted/50">
        <p className="text-muted-foreground">No tasks yet. Add one to get started!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} onDelete={onDelete} onEdit={onEdit} onToggleComplete={onToggleComplete} />
      ))}
    </div>
  )
}
