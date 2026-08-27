<?php

use App\Http\Controllers\AiHistoryController;
use App\Http\Controllers\AiScheduleController;
use App\Http\Controllers\AiSettingsController;
use App\Http\Controllers\ApiDocsController;
use App\Http\Controllers\CategoryManagementController;
use App\Http\Controllers\ContentController;
use App\Http\Controllers\ContentPublishController;
use App\Http\Controllers\ContentReviewController;
use App\Http\Controllers\ContentWorkflowController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MediaLibraryController;
use App\Http\Controllers\RoleManagementController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\TagManagementController;
use App\Http\Controllers\UserAddressController;
use App\Http\Controllers\UserManagementController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('Welcome'))->name('welcome');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');

    Route::get('/contents', [ContentController::class, 'index'])->name('contents.index');
    Route::get('/contents/create', [ContentController::class, 'create'])->name('contents.create');
    Route::post('/contents', [ContentController::class, 'store'])->name('contents.store');
    Route::get('/contents/{content}', [ContentController::class, 'edit'])->name('contents.edit');
    Route::patch('/contents/{content}', [ContentController::class, 'update'])->name('contents.update');
    Route::patch('/contents/{content}/autosave', [ContentController::class, 'autosave'])->name('contents.autosave');
    Route::delete('/contents/{content}', [ContentController::class, 'destroy'])->name('contents.destroy');

    Route::post('/contents/{content}/submit', [ContentWorkflowController::class, 'submit'])->name('contents.submit');
    Route::post('/contents/{content}/approve', [ContentWorkflowController::class, 'approve'])->name('contents.approve');
    Route::post('/contents/{content}/reject', [ContentWorkflowController::class, 'reject'])->name('contents.reject');
    Route::post('/contents/{content}/request-changes', [ContentWorkflowController::class, 'requestChanges'])->name('contents.request-changes');

    Route::post('/contents/{content}/publish', [ContentPublishController::class, 'publish'])->name('contents.publish');
    Route::post('/contents/{content}/schedule', [ContentPublishController::class, 'schedule'])->name('contents.schedule');
    Route::post('/contents/{content}/cancel-schedule', [ContentPublishController::class, 'cancelSchedule'])->name('contents.cancel-schedule');
    Route::post('/contents/{content}/unpublish', [ContentPublishController::class, 'unpublish'])->name('contents.unpublish');
    Route::post('/contents/{content}/archive', [ContentPublishController::class, 'archive'])->name('contents.archive');

    Route::get('/review', ContentReviewController::class)->name('review.index');

    Route::get('/media', [MediaLibraryController::class, 'index'])->name('media.index');
    Route::post('/media', [MediaLibraryController::class, 'store'])->name('media.store')->middleware('throttle:20,1');
    Route::patch('/media/{media}/alt-text', [MediaLibraryController::class, 'updateAltText'])->name('media.alt-text');
    Route::delete('/media/{media}', [MediaLibraryController::class, 'destroy'])->name('media.destroy');

    Route::get('/categories', [CategoryManagementController::class, 'index'])->name('categories.index');
    Route::post('/categories', [CategoryManagementController::class, 'store'])->name('categories.store');
    Route::patch('/categories/{category}', [CategoryManagementController::class, 'update'])->name('categories.update');
    Route::delete('/categories/{category}', [CategoryManagementController::class, 'destroy'])->name('categories.destroy');

    Route::get('/tags', [TagManagementController::class, 'index'])->name('tags.index');
    Route::post('/tags', [TagManagementController::class, 'store'])->name('tags.store');
    Route::patch('/tags/{tag}', [TagManagementController::class, 'update'])->name('tags.update');
    Route::delete('/tags/{tag}', [TagManagementController::class, 'destroy'])->name('tags.destroy');

    Route::get('/users', [UserManagementController::class, 'index'])->name('users.index');
    Route::get('/users/create', [UserManagementController::class, 'create'])->name('users.create');
    Route::post('/users', [UserManagementController::class, 'store'])->name('users.store');
    Route::get('/users/{user}', [UserManagementController::class, 'edit'])->name('users.edit');
    Route::patch('/users/{user}', [UserManagementController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [UserManagementController::class, 'destroy'])->name('users.destroy');
    Route::post('/users/{user}/toggle-active', [UserManagementController::class, 'toggleActive'])->name('users.toggle-active');

    Route::get('/users/{user}/addresses', [UserAddressController::class, 'index'])->name('users.addresses.index');
    Route::post('/users/{user}/addresses', [UserAddressController::class, 'store'])->name('users.addresses.store');
    Route::patch('/users/{user}/addresses/{address}', [UserAddressController::class, 'update'])->name('users.addresses.update');
    Route::delete('/users/{user}/addresses/{address}', [UserAddressController::class, 'destroy'])->name('users.addresses.destroy');

    Route::get('/roles', [RoleManagementController::class, 'index'])->name('roles.index');
    Route::post('/roles', [RoleManagementController::class, 'store'])->name('roles.store');
    Route::patch('/roles/{role}', [RoleManagementController::class, 'update'])->name('roles.update');
    Route::delete('/roles/{role}', [RoleManagementController::class, 'destroy'])->name('roles.destroy');

    Route::get('/settings/profile', [SettingsController::class, 'profile'])->name('settings.profile');
    Route::patch('/settings/profile', [SettingsController::class, 'updateProfile'])->name('settings.profile.update');
    Route::get('/settings/security', [SettingsController::class, 'security'])->name('settings.security');
    Route::get('/settings/appearance', [SettingsController::class, 'appearance'])->name('settings.appearance');
    Route::post('/settings/profile-photo', [SettingsController::class, 'updateProfilePhoto'])->name('settings.profile-photo');
    Route::delete('/settings/profile-photo', [SettingsController::class, 'destroyProfilePhoto'])->name('settings.profile-photo.destroy');

    Route::get('/api-docs', ApiDocsController::class)->name('api-docs.index');

    Route::middleware('role:super_admin')->prefix('ai')->name('ai.')->group(function () {
        Route::get('/settings', [AiSettingsController::class, 'index'])->name('settings');
        Route::put('/settings', [AiSettingsController::class, 'update'])->name('settings.update');

        Route::get('/schedules', [AiScheduleController::class, 'index'])->name('schedules');
        Route::post('/schedules', [AiScheduleController::class, 'store'])->name('schedules.store');
        Route::patch('/schedules/{schedule}', [AiScheduleController::class, 'update'])->name('schedules.update');
        Route::delete('/schedules/{schedule}', [AiScheduleController::class, 'destroy'])->name('schedules.destroy');
        Route::post('/schedules/{schedule}/run', [AiScheduleController::class, 'runNow'])->name('schedules.run');

        Route::get('/history', [AiHistoryController::class, 'index'])->name('history');
    });
});
