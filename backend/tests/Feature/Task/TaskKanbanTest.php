<?php

namespace Tests\Feature\Task;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskKanbanTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_create_task(): void
    {
        $owner = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);

        $res = $this->postJson(
            "/api/v1/projects/{$project->id}/tasks",
            ['title' => 'Tâche Module C', 'status' => Task::STATUS_BACKLOG],
            $this->bearerFor($owner)
        );

        $res->assertCreated();
        $this->assertDatabaseHas('tasks', ['project_id' => $project->id, 'title' => 'Tâche Module C']);
    }

    public function test_task_can_be_updated_and_moved(): void
    {
        $owner = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $task = Task::factory()->create(['project_id' => $project->id, 'status' => Task::STATUS_BACKLOG]);

        $res = $this->putJson(
            "/api/v1/projects/{$project->id}/tasks/{$task->id}",
            ['status' => Task::STATUS_IN_PROGRESS],
            $this->bearerFor($owner)
        );

        $res->assertOk()->assertJsonPath('status', Task::STATUS_IN_PROGRESS);
    }

    public function test_task_can_have_multiple_assignees(): void
    {
        $owner = User::factory()->create();
        $m1 = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $project->members()->attach($m1->id, ['role' => 'member']);

        $res = $this->postJson(
            "/api/v1/projects/{$project->id}/tasks",
            [
                'title' => 'Multi-assign',
                'status' => Task::STATUS_BACKLOG,
                'assignee_ids' => [$m1->id],
            ],
            $this->bearerFor($owner)
        );

        $res->assertCreated();
        $id = (int) $res->json('id');
        $this->assertDatabaseHas('task_user', ['task_id' => $id, 'user_id' => $m1->id]);
    }
}
