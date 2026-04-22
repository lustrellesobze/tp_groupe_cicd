<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

abstract class TestCase extends BaseTestCase
{
    /**
     * @return array<string, string>
     */
    protected function bearerFor(User $user): array
    {
        $token = JWTAuth::fromUser($user);
        if (! is_string($token)) {
            $this->fail('Could not create JWT for test user.');
        }

        return ['Authorization' => 'Bearer '.$token];
    }
}
