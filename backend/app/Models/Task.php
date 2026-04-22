<?php

namespace App\Models;

use Database\Factories\TaskFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Task extends Model
{
    /** @use HasFactory<TaskFactory> */
    use HasFactory;

    public const STATUS_BACKLOG = 'backlog';

    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_REVIEW = 'review';

    public const STATUS_DONE = 'done';

    public static function statuses(): array
    {
        return [
            self::STATUS_BACKLOG,
            self::STATUS_IN_PROGRESS,
            self::STATUS_REVIEW,
            self::STATUS_DONE,
        ];
    }

    protected $fillable = [
        'project_id',
        'title',
        'body',
        'status',
        'position',
        'assignee_id',
        'due_at',
    ];

    protected function casts(): array
    {
        return [
            'due_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    /** Tous les contributeurs (assignation multiple). */
    public function assignees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'task_user')
            ->withTimestamps();
    }
}
