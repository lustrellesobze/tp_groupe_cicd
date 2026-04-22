<?php

namespace Tests\Feature\Api;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_aggregates_tasks_by_status(): void
    {
        $user = User::factory()->create();
        $p = Project::factory()->create(['owner_id' => $user->id]);
        Task::factory()->count(2)->for($p)->create(['status' => Task::STATUS_DONE]);
        Task::factory()->create(['project_id' => $p->id, 'status' => Task::STATUS_BACKLOG]);

        $res = $this->getJson('/api/v1/dashboard', $this->bearerFor($user));

        $res->assertOk()
            ->assertJsonPath('projects_count', 1)
            ->assertJsonPath('tasks_total', 3)
            ->assertJsonPath('tasks_by_status.'.Task::STATUS_DONE, 2)
            ->assertJsonPath('tasks_by_status.'.Task::STATUS_BACKLOG, 1);
    }
}
