<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        $projectIds = Project::query()
            ->where(function ($q) use ($user) {
                $q->where('owner_id', $user->id)
                    ->orWhereHas('members', function ($m) use ($user) {
                        $m->where('users.id', $user->id);
                    });
            })
            ->pluck('id');

        $projectCount = $projectIds->count();
        if ($projectIds->isEmpty()) {
            return response()->json([
                'projects_count' => 0,
                'tasks_total' => 0,
                'tasks_by_status' => array_fill_keys(Task::statuses(), 0),
                'tasks_assigned_to_me' => 0,
                'completion_rate' => 0.0,
                'due_soon_count' => 0,
                'upcoming_due' => [],
            ]);
        }

        $byStatus = Task::query()
            ->whereIn('project_id', $projectIds)
            ->select('status', DB::raw('count(*) as c'))
            ->groupBy('status')
            ->pluck('c', 'status')
            ->all();

        $allStatuses = array_fill_keys(Task::statuses(), 0);
        $tasksByStatus = array_merge($allStatuses, $byStatus);

        $totalTasks = array_sum($tasksByStatus);
        $done = (int) ($tasksByStatus[Task::STATUS_DONE] ?? 0);
        $completion = $totalTasks > 0 ? round(($done / $totalTasks) * 100, 1) : 0.0;

        $tasksAssigned = Task::query()
            ->whereIn('project_id', $projectIds)
            ->where('status', '!=', Task::STATUS_DONE)
            ->where(function ($q) use ($user) {
                $q->where('assignee_id', $user->id)
                    ->orWhereHas('assignees', function ($m) use ($user) {
                        $m->where('users.id', $user->id);
                    });
            })
            ->count();

        $dueSoon = Task::query()
            ->whereIn('project_id', $projectIds)
            ->whereNot('status', Task::STATUS_DONE)
            ->whereNotNull('due_at')
            ->where('due_at', '<=', now()->addDays(7))
            ->count();

        $upcomingDue = Task::query()
            ->whereIn('project_id', $projectIds)
            ->whereNot('status', Task::STATUS_DONE)
            ->whereNotNull('due_at')
            ->with('project:id,name')
            ->orderBy('due_at')
            ->limit(8)
            ->get()
            ->map(function (Task $t) {
                return [
                    'id' => $t->id,
                    'title' => $t->title,
                    'status' => $t->status,
                    'due_at' => $t->due_at?->toIso8601String(),
                    'project' => $t->project?->name,
                ];
            })->all();

        return response()->json([
            'projects_count' => $projectCount,
            'tasks_total' => $totalTasks,
            'tasks_by_status' => $tasksByStatus,
            'tasks_assigned_to_me' => $tasksAssigned,
            'completion_rate' => $completion,
            'due_soon_count' => $dueSoon,
            'upcoming_due' => $upcomingDue,
        ]);
    }
}
