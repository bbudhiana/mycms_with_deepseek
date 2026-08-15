<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddressRequest;
use App\Http\Requests\UserRequest;
use App\Http\Resources\AddressResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UserApiController extends Controller
{
    public function __construct(private readonly ActivityLogService $activityLog) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', User::class);

        $users = User::query()
            ->with('roles:id,name')
            ->when($request->filled('search'), fn (Builder $q) => $q->where(function (Builder $q) use ($request) {
                $q->where('name', 'like', '%'.$request->string('search').'%')
                    ->orWhere('email', 'like', '%'.$request->string('search').'%');
            }))
            ->when($request->filled('role') && $request->input('role') !== 'all', fn (Builder $q) => $q->role($request->string('role')))
            ->orderBy('name')
            ->paginate($request->integer('per_page', 20));

        return UserResource::collection($users);
    }

    public function show(User $user)
    {
        $this->authorize('update', $user);

        return new UserResource($user->load('roles:id,name'));
    }

    public function store(UserRequest $request)
    {
        $this->authorize('create', User::class);

        $data = $request->validated();
        $roles = $data['roles'];
        unset($data['roles'], $data['password_confirmation']);

        if (empty($data['password'])) {
            $data['password'] = Str::random(16);
        }

        $user = User::create($data);
        $user->syncRoles($roles);

        $this->activityLog->log('user.created', $user, "Membuat user '{$user->name}'.");

        return (new UserResource($user->load('roles:id,name')))->response()->setStatusCode(201);
    }

    public function update(UserRequest $request, User $user)
    {
        $this->authorize('update', $user);

        $data = $request->validated();
        $wantsRoleChange = $request->user()->hasPermissionTo('change_role');

        $roles = null;
        if (isset($data['roles'])) {
            $roles = $data['roles'];
            if (! $wantsRoleChange) {
                abort_unless($roles === $user->getRoleNames()->all(), 403);
            }
        }

        unset($data['roles'], $data['password_confirmation']);

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);

        if ($roles) {
            $user->syncRoles($roles);
        }

        $this->activityLog->log('user.updated', $user, "Memperbarui user '{$user->name}'.");

        return new UserResource($user->load('roles:id,name'));
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        $name = $user->name;
        $user->delete();

        $this->activityLog->log('user.deleted', null, "Menghapus user '{$name}'.");

        return response()->json(['message' => 'User deleted.']);
    }

    public function changeRole(Request $request, User $user): UserResource
    {
        $this->authorize('changeRole', $user);

        $validated = $request->validate(['role' => ['required', 'string', 'exists:roles,name']]);

        $user->syncRoles([$validated['role']]);

        $this->activityLog->log('user.role_changed', $user, "Mengubah role '{$user->name}' menjadi '{$validated['role']}'.");

        return new UserResource($user->load('roles:id,name'));
    }

    public function activate(User $user): UserResource
    {
        $this->authorize('activate', $user);

        $user->update(['is_active' => true]);
        $this->activityLog->log('user.activated', $user, "Mengaktifkan user '{$user->name}'.");

        return new UserResource($user->fresh());
    }

    public function deactivate(User $user): UserResource
    {
        $this->authorize('deactivate', $user);

        $user->update(['is_active' => false]);
        $this->activityLog->log('user.deactivated', $user, "Menonaktifkan user '{$user->name}'.");

        return new UserResource($user->fresh());
    }

    public function listAddresses(User $user)
    {
        $this->authorize('update', $user);

        return AddressResource::collection($user->addresses);
    }

    public function storeAddress(AddressRequest $request, User $user)
    {
        $this->authorize('update', $user);

        $data = $request->validated();
        $data['is_primary'] = $request->boolean('is_primary');

        if ($data['is_primary']) {
            $user->addresses()->update(['is_primary' => false]);
        }

        $address = $user->addresses()->create($data);

        return (new AddressResource($address))->response()->setStatusCode(201);
    }
}
