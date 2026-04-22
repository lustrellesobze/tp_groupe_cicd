<?php

namespace Tests\Feature\Api;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_can_create_task_in_project(): void
    {
        $owner = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);

        $res = $this->postJson(
            "/api/v1/projects/{$project->id}/tasks",
            [
                'title' => 'First task',
                'status' => Task::STATUS_BACKLOG,
            ],
            $this->bearerFor($owner)
        );

        $res->assertCreated();
        $this->assertDatabaseHas('tasks', [
            'project_id' => $project->id,
            'title' => 'First task',
        ]);
    }

    public function test_cannot_assign_task_to_non_project_member(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);

        $res = $this->postJson(
            "/api/v1/projects/{$project->id}/tasks",
            [
                'title' => 'T',
                'status' => Task::STATUS_IN_PROGRESS,
                'assignee_id' => $outsider->id,
            ],
            $this->bearerFor($owner)
        );

        $res->assertStatus(422);
    }

    public function test_task_can_have_multiple_assignees_from_project(): void
    {
        $owner = User::factory()->create();
        $m1 = User::factory()->create();
        $m2 = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $project->members()->attach($m1->id, ['role' => 'member']);
        $project->members()->attach($m2->id, ['role' => 'member']);

        $res = $this->postJson(
            "/api/v1/projects/{$project->id}/tasks",
            [
                'title' => 'Multi',
                'status' => Task::STATUS_BACKLOG,
                'assignee_ids' => [$m1->id, $m2->id],
            ],
            $this->bearerFor($owner)
        );

        $res->assertCreated();
        $id = (int) $res->json('id');
        $this->assertDatabaseHas('task_user', ['task_id' => $id, 'user_id' => $m1->id]);
        $this->assertDatabaseHas('task_user', ['task_id' => $id, 'user_id' => $m2->id]);
        $this->assertEquals($m1->id, $res->json('assignee_id'));
    }
}
