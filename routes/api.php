<?php

use App\Http\Controllers\Api\CategoryApiController;
use App\Http\Controllers\Api\ContentApiController;
use App\Http\Controllers\Api\ContentPublishApiController;
use App\Http\Controllers\Api\ContentWorkflowApiController;
use App\Http\Controllers\Api\MediaApiController;
use App\Http\Controllers\Api\TagApiController;
use App\Http\Controllers\Api\UserApiController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'verified'])->group(function () {
    Route::apiResource('users', UserApiController::class)->only(['index', 'store', 'show', 'update', 'destroy'])->names('api.users');
    Route::post('users/{user}/role', [UserApiController::class, 'changeRole']);
    Route::post('users/{user}/activate', [UserApiController::class, 'activate']);
    Route::post('users/{user}/deactivate', [UserApiController::class, 'deactivate']);
    Route::get('users/{user}/addresses', [UserApiController::class, 'listAddresses']);
    Route::post('users/{user}/addresses', [UserApiController::class, 'storeAddress']);

    Route::get('categories/tree', [CategoryApiController::class, 'tree']);
    Route::apiResource('categories', CategoryApiController::class)->names('api.categories');

    Route::get('tags/search', [TagApiController::class, 'search']);
    Route::apiResource('tags', TagApiController::class)->names('api.tags');

    Route::get('media', [MediaApiController::class, 'index']);
    Route::post('media', [MediaApiController::class, 'store'])->middleware('throttle:20,1');
    Route::get('media/{media}', [MediaApiController::class, 'show']);
    Route::patch('media/{media}', [MediaApiController::class, 'updateAltText']);
    Route::delete('media/{media}', [MediaApiController::class, 'destroy']);

    Route::get('contents/pending-review', [ContentApiController::class, 'pendingReview']);
    Route::get('contents/scheduled', [ContentApiController::class, 'scheduled']);
    Route::get('contents/{content}/approval-history', [ContentApiController::class, 'approvalHistory']);

    Route::post('contents/{content}/submit', [ContentWorkflowApiController::class, 'submit']);
    Route::post('contents/{content}/approve', [ContentWorkflowApiController::class, 'approve']);
    Route::post('contents/{content}/reject', [ContentWorkflowApiController::class, 'reject']);
    Route::post('contents/{content}/request-changes', [ContentWorkflowApiController::class, 'requestChanges']);

    Route::post('contents/{content}/publish', [ContentPublishApiController::class, 'publish']);
    Route::post('contents/{content}/schedule', [ContentPublishApiController::class, 'schedule']);
    Route::post('contents/{content}/unpublish', [ContentPublishApiController::class, 'unpublish']);
    Route::post('contents/{content}/archive', [ContentPublishApiController::class, 'archive']);

    Route::apiResource('contents', ContentApiController::class)->names('api.contents');
});
