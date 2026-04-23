<?php

use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\ProjectMemberController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:api')->group(function () {
    Route::apiResource('projects', ProjectController::class);
    Route::post('projects/{project}/members', [ProjectMemberController::class, 'store']);
    Route::delete('projects/{project}/members/{user}', [ProjectMemberController::class, 'destroy']);
});
