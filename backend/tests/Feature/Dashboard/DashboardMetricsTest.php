<?php

namespace Tests\Feature\Dashboard;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardMetricsTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_returns_stats(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        Task::factory()->count(3)->create(['project_id' => $project->id, 'status' => Task::STATUS_BACKLOG]);
        Task::factory()->count(2)->create(['project_id' => $project->id, 'status' => Task::STATUS_DONE]);

        $res = $this->getJson('/api/v1/dashboard', $this->bearerFor($user));
        $res->assertOk()
            ->assertJsonPath('projects_count', 1)
            ->assertJsonPath('tasks_total', 5)
            ->assertJsonFragment(['completion_rate' => 40]);
    }

    public function test_metrics_returns_prometheus_format(): void
    {
        $res = $this->get('/api/v1/metrics');
        $res->assertOk()
            ->assertHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
        $body = $res->getContent();
        $this->assertStringContainsString('taskflow_users_total', $body);
        $this->assertStringContainsString('taskflow_projects_total', $body);
        $this->assertStringContainsString('taskflow_tasks_total', $body);
        $this->assertStringContainsString('taskflow_db_up', $body);
    }
}
