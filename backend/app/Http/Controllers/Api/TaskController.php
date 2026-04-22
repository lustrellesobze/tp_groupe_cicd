<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    public function index(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);
        $tasks = $project->tasks()
            ->with([
                'assignee:id,name,email',
                'assignees' => function ($q) {
                    $q->select('users.id', 'users.name', 'users.email')->orderBy('users.name');
                },
            ])
            ->orderBy('status')
            ->orderBy('position')
            ->get();

        return response()->json($tasks);
    }

    public function store(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);
        $data = $request->validate([
            'title' => ['required', 'string', 'max:500'],
            'body' => ['nullable', 'string'],
            'status' => ['required', 'string', Rule::in(Task::statuses())],
            'position' => ['nullable', 'integer', 'min:0'],
            'assignee_id' => ['nullable', 'exists:users,id'],
            'assignee_ids' => ['nullable', 'array'],
            'assignee_ids.*' => ['integer', 'exists:users,id'],
            'due_at' => ['nullable', 'date'],
        ]);

        $ids = $this->assigneeIdsFromRequest($request, isUpdate: false);
        if ($err = $this->validateMemberIds($project, $ids)) {
            return $err;
        }

        $fill = collect($data)
            ->except(['assignee_id', 'assignee_ids'])
            ->all();
        $fill['assignee_id'] = $ids[0] ?? null;
        $fill['position'] = $data['position'] ?? $this->nextPosition($project, $data['status']);

        $task = $project->tasks()->create($fill);
        $task->assignees()->sync($ids);
        $this->eagerForJson($task->fresh());

        return response()->json($task, 201);
    }

    public function show(Request $request, Project $project, Task $task): JsonResponse
    {
        $this->ensureTaskInProject($project, $task);
        $this->authorize('view', $project);
        $this->eagerForJson($task);

        return response()->json($task);
    }

    public function update(Request $request, Project $project, Task $task): JsonResponse
    {
        $this->ensureTaskInProject($project, $task);
        $this->authorize('view', $project);
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:500'],
            'body' => ['nullable', 'string'],
            'status' => ['sometimes', 'string', Rule::in(Task::statuses())],
            'position' => ['nullable', 'integer', 'min:0'],
            'assignee_id' => ['nullable', 'exists:users,id'],
            'assignee_ids' => ['nullable', 'array'],
            'assignee_ids.*' => ['integer', 'exists:users,id'],
            'due_at' => ['nullable', 'date'],
        ]);

        $ids = $this->assigneeIdsFromRequest($request, isUpdate: true);
        if ($ids !== null) {
            if ($err = $this->validateMemberIds($project, $ids)) {
                return $err;
            }
        }

        $update = collect($data)->except(['assignee_id', 'assignee_ids'])->all();
        if ($ids !== null) {
            $update['assignee_id'] = $ids[0] ?? null;
        }
        if (count($update) > 0) {
            $task->update($update);
        }
        if ($ids !== null) {
            $task->assignees()->sync($ids);
        }
        $this->eagerForJson($task->fresh());

        return response()->json($task);
    }

    public function destroy(Request $request, Project $project, Task $task): JsonResponse
    {
        $this->ensureTaskInProject($project, $task);
        $this->authorize('view', $project);
        $task->delete();

        return response()->json(null, 204);
    }

    private function ensureTaskInProject(Project $project, Task $task): void
    {
        if ($task->project_id !== $project->id) {
            abort(404);
        }
    }

    private function nextPosition(Project $project, string $status): int
    {
        $max = $project->tasks()->where('status', $status)->max('position');

        return (int) $max + 1;
    }

    /**
     * @return list<int>
     */
    private function assigneeIdsFromRequest(Request $request, bool $isUpdate): ?array
    {
        if ($request->has('assignee_ids')) {
            $raw = (array) $request->input('assignee_ids', []);
            $ids = array_values(array_unique(array_map('intval', $raw)));
            sort($ids);

            return $ids;
        }
        if (array_key_exists('assignee_id', $request->all())) {
            $a = $request->input('assignee_id');
            if ($a === null || $a === '') {
                return [];
            }

            return [(int) $a];
        }
        if ($isUpdate) {
            return null;
        }

        return [];
    }

    /**
     * @param  list<int>  $ids
     */
    private function validateMemberIds(Project $project, array $ids): ?JsonResponse
    {
        foreach (array_unique($ids) as $id) {
            if ((int) $id === (int) $project->owner_id) {
                continue;
            }
            if (! $project->members()->whereKey($id)->exists()) {
                return response()->json(['message' => 'Chaque assigné doit être un membre du projet.'], 422);
            }
        }

        return null;
    }

    private function eagerForJson(Task $task): void
    {
        $task->load([
            'assignee:id,name,email',
            'assignees' => function ($q) {
                $q->select('users.id', 'users.name', 'users.email')->orderBy('users.name');
            },
        ]);
    }
}
