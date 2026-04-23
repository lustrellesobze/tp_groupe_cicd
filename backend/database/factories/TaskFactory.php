<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'title' => $this->faker->sentence(4),
            'body' => $this->faker->optional()->paragraph(),
            'status' => Task::STATUS_BACKLOG,
            'position' => 0,
            'assignee_id' => null,
            'due_at' => null,
        ];
    }
}
