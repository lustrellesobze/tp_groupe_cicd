<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['task_id', 'user_id']);
        });

        $connection = DB::getDriverName();
        if ($connection === 'sqlite' || $connection === 'mysql') {
            $tasks = DB::table('tasks')->whereNotNull('assignee_id')->get(['id', 'assignee_id']);
            $now = now();
            foreach ($tasks as $row) {
                DB::table('task_user')->updateOrInsert(
                    ['task_id' => $row->id, 'user_id' => $row->assignee_id],
                    ['created_at' => $now, 'updated_at' => $now]
                );
            }
        } else {
            $tasks = DB::table('tasks')->whereNotNull('assignee_id')->get(['id', 'assignee_id']);
            $now = now();
            foreach ($tasks as $row) {
                try {
                    DB::table('task_user')->updateOrInsert(
                        ['task_id' => $row->id, 'user_id' => $row->assignee_id],
                        ['created_at' => $now, 'updated_at' => $now]
                    );
                } catch (\Throwable) {
                    // best-effort
                }
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('task_user');
    }
};
