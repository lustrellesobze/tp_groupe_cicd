<?php

use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MetricsController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:api')->group(function () {
    Route::get('dashboard', DashboardController::class);
});

Route::get('metrics', [MetricsController::class, 'index']);
