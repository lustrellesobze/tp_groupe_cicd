import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useMemo, useState, type ReactNode } from 'react';
import type { Task, TaskStatus } from '../types/api';
import { TASK_STATUSES } from '../types/api';
import { statusLabel } from '../lib/columns';
import { tasksApi } from '../api/taskflow';
import { dueHint, statusProgressPercent } from '../lib/taskMeta';

type Props = {
  projectId: number;
  items: Task[];
  onUpdate: (tasks: Task[]) => void;
  readOnly?: boolean;
  onEditTask?: (t: Task) => void;
};

const COL_SET = new Set(TASK_STATUSES as readonly string[]);

function Col({
  colId,
  children,
  readOnly,
}: {
  colId: string;
  children: ReactNode;
  readOnly: boolean;
}) {
  if (readOnly) {
    return <div className="kanban-col">{children}</div>;
  }
  return <DroppableCol status={colId}>{children}</DroppableCol>;
}

function DroppableCol({ status, children }: { status: string; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: status });
  return (
    <div ref={setNodeRef} className={isOver ? 'kanban-col kanban-col--active' : 'kanban-col'} data-status={status}>
      {children}
    </div>
  );
}

function assigneeList(task: Task) {
  if (task.assignees && task.assignees.length > 0) {
    return task.assignees;
  }
  if (task.assignee) {
    return [task.assignee];
  }
  return [];
}

function TaskCardContent({ task }: { task: Task }) {
  const pct = statusProgressPercent(task.status);
  const due = dueHint(task.due_at);
  const people = assigneeList(task);
  return (
    <>
      <div className="task-card__bar-wrap" title="Évolution (liée au statut)">
        <div className="task-card__bar">
          <div className="task-card__bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="task-card__pct">{pct}%</span>
      </div>
      {due && <div className="task-card__due">{due}</div>}
      {people.length > 0 && (
        <ul className="task-card__assignees" aria-label="Personnes assignées">
          {people.map((p) => (
            <li key={p.id} className="task-card__assignee" title={p.email}>
              <span className="task-card__initials" aria-hidden>
                {p.name
                  .split(/\s+/)
                  .map((s) => s[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <span className="task-card__name">{p.name}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function TaskCard({
  task,
  readOnly,
  activeId,
  onEdit,
}: {
  task: Task;
  readOnly: boolean;
  activeId: string | null;
  onEdit?: (t: Task) => void;
}) {
  if (readOnly) {
    return (
      <div className="task-card" style={{ cursor: 'default' }}>
        <div className="task-card__row">
          <div className="task-card__body">
            <div className="task-card__title">{task.title}</div>
            <TaskCardContent task={task} />
          </div>
        </div>
      </div>
    );
  }
  return <DraggableTask task={task} activeId={activeId} onEdit={onEdit} />;
}

function DraggableTask({
  task,
  activeId,
  onEdit,
}: {
  task: Task;
  activeId: string | null;
  onEdit?: (t: Task) => void;
}) {
  const { setNodeRef, transform, attributes, listeners, isDragging } = useDraggable({ id: `t-${task.id}` });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px,0)` : undefined,
    zIndex: isDragging || (activeId === `t-${task.id}`) ? 20 : undefined,
  } as const;
  return (
    <div
      ref={setNodeRef}
      className={isDragging || activeId === `t-${task.id}` ? 'task-card task-card--drag' : 'task-card'}
      style={style}
    >
      <div className="task-card__row">
        <span
          className="task-card__grip"
          {...attributes}
          {...listeners}
          aria-label="Déplacer la tâche"
          title="Glisser"
        />
        <div className="task-card__body">
          <div className="task-card__title">{task.title}</div>
          <TaskCardContent task={task} />
        </div>
      </div>
      {onEdit && (
        <div className="task-card__actions" onPointerDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="tf-btn ghost task-card__edit"
            onClick={() => onEdit(task)}
          >
            Modifier
          </button>
        </div>
      )}
    </div>
  );
}

function groupByStatus(items: Task[]) {
  const m: Record<string, Task[]> = {};
  for (const s of TASK_STATUSES) m[s] = [];
  for (const t of items) {
    const key = TASK_STATUSES.includes(t.status) ? t.status : 'backlog';
    m[key]!.push(t);
  }
  for (const s of Object.keys(m)) {
    m[s] = m[s]!.sort((a, b) => a.position - b.position);
  }
  return m;
}

export function TaskBoard({ projectId, items, onUpdate, readOnly = false, onEditTask }: Props) {
  const byCol = useMemo(() => groupByStatus(items), [items]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  async function handleDragEnd(ev: DragEndEvent) {
    if (readOnly) return;
    setActiveId(null);
    const overId = ev.over?.id;
    if (overId === null || overId === undefined) return;
    if (!COL_SET.has(String(overId))) return;
    const newStatus = String(overId) as TaskStatus;
    const active = String(ev.active.id);
    if (!active.startsWith('t-')) return;
    const taskId = parseInt(active.slice(2), 10);
    const task = items.find((x) => x.id === taskId);
    if (!task || task.status === newStatus) {
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const listInTarget = byCol[newStatus] ?? [];
      const { data: updated } = await tasksApi.update(projectId, taskId, {
        status: newStatus,
        position: listInTarget.length,
      });
      onUpdate(
        items.map((t) => (t.id === taskId ? updated : t))
      );
    } catch (e) {
      setErr(String((e as Error)?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  const grid = (
    <div className="kanban-wrapper" role="region" aria-label="Tableau Kanban">
      <div className="grid-kanban">
        {TASK_STATUSES.map((s) => (
          <Col key={s} colId={s} readOnly={readOnly}>
            <h3>
              <span
                className={`pill pill--${s}`}
                style={{ minWidth: 6, borderRadius: 2, padding: 0, width: 6, height: 4 }}
              />
              {statusLabel(s)}
              <span className="badge">{byCol[s]?.length ?? 0}</span>
            </h3>
            {(byCol[s]?.length ?? 0) === 0 && <div className="empty-hint">Aucune tâche ici</div>}
            {byCol[s]!.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                readOnly={readOnly}
                activeId={activeId}
                onEdit={onEditTask}
              />
            ))}
          </Col>
        ))}
      </div>
    </div>
  );

  if (readOnly) {
    return grid;
  }

  return (
    <div>
      {busy && <p className="tf-mono" role="status">Mise à jour de la tâche…</p>}
      {err && <p className="tf-error" role="alert">{err}</p>}
      <DndContext
        sensors={sensors}
        onDragStart={({ active }) => setActiveId(String(active.id))}
        onDragEnd={(e) => {
          void handleDragEnd(e);
        }}
        onDragCancel={() => setActiveId(null)}
      >
        {grid}
      </DndContext>
    </div>
  );
}
