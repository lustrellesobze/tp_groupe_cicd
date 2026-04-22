<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
        ]);

        $token = JWTAuth::fromUser($user);
        if (! is_string($token)) {
            return response()->json(['message' => 'Could not create token.'], 500);
        }

        return $this->respondWithToken($token, $user, 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! $user = User::where('email', $credentials['email'])->first()) {
            return response()->json(['message' => 'Identifiants invalides.'], 401);
        }

        if (! Hash::check($credentials['password'], $user->password)) {
            return response()->json(['message' => 'Identifiants invalides.'], 401);
        }

        $token = JWTAuth::fromUser($user);
        if (! is_string($token)) {
            return response()->json(['message' => 'Could not create token.'], 500);
        }

        return $this->respondWithToken($token, $user, 200);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }

    public function logout(): JsonResponse
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
        } catch (JWTException) {
            // ignore
        }

        return response()->json(['message' => 'Déconnexion réussie.']);
    }

    public function refresh(): JsonResponse
    {
        try {
            $new = auth('api')->refresh();
        } catch (JWTException) {
            return response()->json(['message' => 'Token invalide.'], 401);
        }

        if (! is_string($new)) {
            return response()->json(['message' => 'Impossible de rafraîchir le token.'], 500);
        }

        return response()->json([
            'access_token' => $new,
            'token_type' => 'bearer',
            'expires_in' => (int) (config('jwt.ttl', 60) * 60),
        ]);
    }

    private function respondWithToken(string $token, User $user, int $status = 200): JsonResponse
    {
        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => (int) (config('jwt.ttl', 60) * 60),
            'user' => $user,
        ], $status);
    }
}
