<?php

namespace Tests\Feature\Api;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectTest extends TestCase
{
    use RefreshDatabase;

    public function test_list_returns_only_accessible_projects(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        $p1 = Project::factory()->create(['owner_id' => $a->id]);
        $p2 = Project::factory()->create(['owner_id' => $b->id]);

        $res = $this->getJson('/api/v1/projects', $this->bearerFor($a));
        $res->assertOk();
        $ids = collect($res->json())->pluck('id')->all();
        $this->assertContains($p1->id, $ids);
        $this->assertNotContains($p2->id, $ids);
    }

    public function test_user_not_member_cannot_view_project(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $p = Project::factory()->create(['owner_id' => $owner->id]);

        $res = $this->getJson("/api/v1/projects/{$p->id}", $this->bearerFor($stranger));
        $res->assertForbidden();
    }

    public function test_only_owner_can_update(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $p = Project::factory()->create(['owner_id' => $owner->id]);
        $p->members()->syncWithoutDetaching([$member->id => ['role' => 'member']]);

        $r = $this->putJson("/api/v1/projects/{$p->id}", [
            'name' => 'Hacked name',
        ], $this->bearerFor($member));
        $r->assertForbidden();
    }
}
