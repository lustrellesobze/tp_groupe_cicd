<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class MetricsController extends Controller
{
    public function index(): Response
    {
        $lines = [];

        // --- Application metrics ---
        $lines[] = '# HELP taskflow_users_total Total registered users';
        $lines[] = '# TYPE taskflow_users_total gauge';
        $lines[] = 'taskflow_users_total '.User::count();

        $lines[] = '# HELP taskflow_projects_total Total projects';
        $lines[] = '# TYPE taskflow_projects_total gauge';
        $lines[] = 'taskflow_projects_total '.Project::count();

        $lines[] = '# HELP taskflow_tasks_total Total tasks';
        $lines[] = '# TYPE taskflow_tasks_total gauge';
        $lines[] = 'taskflow_tasks_total '.Task::count();

        foreach (Task::statuses() as $status) {
            $lines[] = '# HELP taskflow_tasks_by_status Tasks by status';
            $lines[] = '# TYPE taskflow_tasks_by_status gauge';
            $count = Task::where('status', $status)->count();
            $lines[] = "taskflow_tasks_by_status{status=\"{$status}\"} {$count}";
        }

        // --- DB connection check ---
        try {
            DB::connection()->getPdo();
            $lines[] = '# HELP taskflow_db_up Database connection status';
            $lines[] = '# TYPE taskflow_db_up gauge';
            $lines[] = 'taskflow_db_up 1';
        } catch (\Exception) {
            $lines[] = '# HELP taskflow_db_up Database connection status';
            $lines[] = '# TYPE taskflow_db_up gauge';
            $lines[] = 'taskflow_db_up 0';
        }

        return response(implode("\n", $lines)."\n", 200, [
            'Content-Type' => 'text/plain; version=0.0.4; charset=utf-8',
        ]);
    }
}
