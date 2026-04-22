<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $projects = Project::query()
            ->where(function ($q) use ($user) {
                $q->where('owner_id', $user->id)
                    ->orWhereHas('members', function ($m) use ($user) {
                        $m->where('users.id', $user->id);
                    });
            })
            ->with('owner')
            ->withCount('tasks')
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json($projects);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $user = $request->user();

        $project = new Project($data);
        $project->owner_id = $user->id;
        $project->save();
        $project->members()->attach($user->id, ['role' => 'owner']);

        $project->load('owner');
        $project->loadCount('tasks');

        return response()->json($project, 201);
    }

    public function show(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);
        $project->load('owner', 'members');
        $project->loadCount('tasks');

        return response()->json($project);
    }

    public function update(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);
        $project->update($data);
        $project->load('owner', 'members');
        $project->loadCount('tasks');

        return response()->json($project);
    }

    public function destroy(Request $request, Project $project): JsonResponse
    {
        $this->authorize('delete', $project);
        $project->delete();

        return response()->json(null, 204);
    }
}
