<?php

namespace Tests\Feature\Api;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectTest extends TestCase
{
    use RefreshDatabase;

    public function test_list_returns_only_accessible_projects(): void
    {
        $this->markTestSkipped('Module project non déployé — en attente PR ngokeng-rayan');
    }

    public function test_user_not_member_cannot_view_project(): void
    {
        $this->markTestSkipped('Module project non déployé — en attente PR ngokeng-rayan');
    }

    public function test_only_owner_can_update(): void
    {
        $this->markTestSkipped('Module project non déployé — en attente PR ngokeng-rayan');
    }
}
