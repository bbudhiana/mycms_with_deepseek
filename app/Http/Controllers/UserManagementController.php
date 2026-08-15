<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserRequest;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserManagementController extends Controller
{
    public function __construct(private readonly ActivityLogService $activityLog) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', User::class);

        $users = User::query()
            ->with('roles:id,name')
            ->select(['id', 'name', 'email', 'job_title', 'is_active', 'email_verified_at'])
            ->when($request->filled('search'), fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->string('search').'%')
                    ->orWhere('email', 'like', '%'.$request->string('search').'%');
            }))
            ->when($request->filled('role') && $request->input('role') !== 'all', function ($q) use ($request) {
                $q->role($request->string('role'));
            })
            ->when($request->filled('status') && $request->input('status') !== 'all', function ($q) use ($request) {
                $q->where('is_active', $request->input('status') === 'active');
            })
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Users/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'role', 'status']),
            'roles' => Role::query()->orderBy('name')->get(['id', 'name']),
            'can' => [
                'manage' => $request->user()->hasPermissionTo('manage_user'),
                'changeRole' => $request->user()->hasPermissionTo('change_role'),
            ],
        ]);
    }

    public function create(Request $request)
    {
        $this->authorize('create', User::class);

        return Inertia::render('Users/Form', [
            'user' => null,
            'roles' => Role::query()->orderBy('name')->get(['id', 'name']),
        ]);
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

        return Redirect::route('users.index')->with('success', 'User berhasil dibuat.');
    }

    public function edit(Request $request, User $user)
    {
        $this->authorize('update', $user);

        return Inertia::render('Users/Form', [
            'user' => $user->load('roles:id,name', 'addresses'),
            'roles' => Role::query()->orderBy('name')->get(['id', 'name']),
            'can' => ['changeRole' => $request->user()->hasPermissionTo('change_role')],
        ]);
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

        return Redirect::back()->with('success', 'User diperbarui.');
    }

    public function destroy(Request $request, User $user)
    {
        $this->authorize('delete', $user);

        $name = $user->name;
        $user->delete();

        $this->activityLog->log('user.deleted', null, "Menghapus user '{$name}'.");

        return Redirect::route('users.index')->with('success', 'User dihapus.');
    }

    public function toggleActive(Request $request, User $user)
    {
        $method = $request->boolean('activate') ? 'activate' : 'deactivate';
        $this->authorize($method, $user);

        $user->update(['is_active' => $request->boolean('activate')]);

        $this->activityLog->log(
            $request->boolean('activate') ? 'user.activated' : 'user.deactivated',
            $user,
            ($request->boolean('activate') ? 'Mengaktifkan' : 'Menonaktifkan')." user '{$user->name}'."
        );

        return Redirect::back()->with('success', 'Status user diperbarui.');
    }
}
