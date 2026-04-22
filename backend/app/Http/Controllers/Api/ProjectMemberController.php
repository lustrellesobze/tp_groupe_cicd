<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProjectMemberController extends Controller
{
    public function store(Request $request, Project $project): JsonResponse
    {
        $this->authorize('manageMembers', $project);
        $data = $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
            'role' => ['sometimes', 'string', Rule::in(['member', 'viewer'])],
        ]);

        $user = User::where('email', $data['email'])->firstOrFail();
        if ($user->id === $project->owner_id) {
            return response()->json(['message' => 'L’auteur est déjà membre.'], 422);
        }
        if ($project->members()->whereKey($user->id)->exists()) {
            return response()->json(['message' => 'Cet utilisateur est déjà membre.'], 422);
        }

        $project->members()->attach($user->id, ['role' => $data['role'] ?? 'member']);
        $project->load('members', 'owner');

        return response()->json($project, 201);
    }

    public function destroy(Request $request, Project $project, User $user): JsonResponse
    {
        $this->authorize('manageMembers', $project);
        if ($user->id === $project->owner_id) {
            return response()->json(['message' => 'Impossible de retirer le propriétaire.'], 422);
        }
        if (! $project->members()->whereKey($user->id)->exists()) {
            return response()->json(['message' => 'Utilisateur non membre.'], 404);
        }

        $project->members()->detach($user->id);

        return response()->json(['message' => 'Membre retiré.']);
    }
}
