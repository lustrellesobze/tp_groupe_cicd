<?php

namespace Tests\Feature\Project;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_create_project(): void
    {
        $user = User::factory()->create();

        $res = $this->postJson('/api/v1/projects', [
            'name' => 'Projet Module B',
            'description' => 'Description du projet',
        ], $this->bearerFor($user));

        $res->assertCreated()
            ->assertJsonPath('name', 'Projet Module B');
        $this->assertDatabaseHas('projects', ['name' => 'Projet Module B', 'owner_id' => $user->id]);
    }

    public function test_list_returns_only_accessible_projects(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        $p1 = Project::factory()->create(['owner_id' => $a->id]);
        Project::factory()->create(['owner_id' => $b->id]);

        $res = $this->getJson('/api/v1/projects', $this->bearerFor($a));
        $res->assertOk();
        $ids = collect($res->json())->pluck('id')->all();
        $this->assertContains($p1->id, $ids);
        $this->assertCount(1, $ids);
    }

    public function test_member_can_be_added_and_removed(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);

        $add = $this->postJson("/api/v1/projects/{$project->id}/members", [
            'email' => $member->email,
            'role' => 'member',
        ], $this->bearerFor($owner));
        $add->assertCreated();

        $remove = $this->deleteJson("/api/v1/projects/{$project->id}/members/{$member->id}", [], $this->bearerFor($owner));
        $remove->assertOk();
    }
}
