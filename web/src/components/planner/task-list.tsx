'use client'

import { useActionState } from "react";
import { format } from "date-fns";
import { TaskStatus } from "@prisma/client";

import { updateTaskStatusAction, createTaskAction } from "@/actions/tasks";
import { initialActionState } from "@/lib/action-state";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  dueDate?: string | null;
  contentItem: {
    id: string;
    title: string;
    scheduledAt: string | null;
  };
  assignee?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
};

type ContentOption = {
  id: string;
  title: string;
};

type MemberOption = {
  id: string;
  label: string;
};

const statusLabels: Record<TaskStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  BLOCKED: "Blocked",
};

type TaskListProps = {
  tasks: Task[];
  contentItems: ContentOption[];
  members: MemberOption[];
};

export function TaskList({ tasks, contentItems, members }: TaskListProps) {
  const [state, statusAction, isPending] = useActionState(updateTaskStatusAction, initialActionState);
  const [createState, createAction, createPending] = useActionState(createTaskAction, initialActionState);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="order-2 lg:order-1">
        <CardHeader>
          <CardTitle className="text-base">Open tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks yet.</p>}
          {tasks.map((task) => (
            <div key={task.id} className="rounded-xl border p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.contentItem.title}
                    {task.dueDate ? ` · due ${format(new Date(task.dueDate), "MMM d")}` : ""}
                  </p>
                  {task.assignee && (
                    <p className="text-xs text-muted-foreground">
                      Assigned to {task.assignee.firstName ? `${task.assignee.firstName} ${task.assignee.lastName ?? ""}` : task.assignee.email}
                    </p>
                  )}
                </div>
                <form action={statusAction} className="flex items-center gap-2">
                  <input type="hidden" name="taskId" value={task.id} />
                  <Select name="status" defaultValue={task.status} disabled={isPending}>
                    <SelectTrigger className="h-9 w-[150px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="submit" size="sm" variant="outline" disabled={isPending}>
                    Save
                  </Button>
                </form>
              </div>
            </div>
          ))}
          {state.message && state.status === "error" && (
            <p className="text-xs text-destructive">{state.message}</p>
          )}
        </CardContent>
      </Card>
      <Card className="order-1 lg:order-2">
        <CardHeader>
          <CardTitle className="text-base">Create task</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createAction} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="contentItemId">Content item</Label>
              <Select name="contentItemId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {contentItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="taskTitle">Task title</Label>
              <Input id="taskTitle" name="taskTitle" placeholder="Edit SEO brief" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="taskDescription">Description</Label>
              <Textarea id="taskDescription" name="taskDescription" rows={3} placeholder="Add context for assignee" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="taskDueDate">Due date</Label>
                <Input id="taskDueDate" name="taskDueDate" type="date" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="assigneeId">Assignee</Label>
                <Select name="assigneeId">
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {createState.message && createState.status === "error" && (
              <p className="text-xs text-destructive">{createState.message}</p>
            )}
            <Button type="submit" disabled={createPending}>
              {createPending ? "Creating…" : "Add task"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
