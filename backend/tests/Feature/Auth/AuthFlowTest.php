<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_returns_token_and_user(): void
    {
        $res = $this->postJson('/api/v1/auth/register', [
            'name' => 'MembreA',
            'email' => 'membrea@example.com',
            'password' => 'Password1!',
            'password_confirmation' => 'Password1!',
        ]);

        $res->assertCreated()
            ->assertJsonPath('user.email', 'membrea@example.com')
            ->assertJsonStructure(['access_token', 'token_type', 'expires_in', 'user']);
        $this->assertDatabaseHas('users', ['email' => 'membrea@example.com']);
    }

    public function test_login_succeeds_with_valid_credentials(): void
    {
        $user = User::factory()->create(['email' => 'a@example.com', 'password' => 'Password1!']);

        $res = $this->postJson('/api/v1/auth/login', [
            'email' => 'a@example.com',
            'password' => 'Password1!',
        ]);

        $res->assertOk()->assertJsonPath('user.id', $user->id);
    }

    public function test_me_returns_authenticated_user(): void
    {
        $user = User::factory()->create();
        $res = $this->getJson('/api/v1/auth/me', $this->bearerFor($user));
        $res->assertOk()->assertJsonPath('id', $user->id);
    }

    public function test_logout_invalidates_token(): void
    {
        $user = User::factory()->create();
        $res = $this->postJson('/api/v1/auth/logout', [], $this->bearerFor($user));
        $res->assertOk();
    }
}
