<?php

namespace App\Http\Controllers;

use App\Http\Requests\AddressRequest;
use App\Models\Address;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class UserAddressController extends Controller
{
    public function __construct(private readonly ActivityLogService $activityLog) {}

    public function index(Request $request, User $user)
    {
        $this->authorize('update', $user);

        return Inertia::render('Users/Addresses', [
            'user' => $user->load('addresses'),
            'can' => ['manage' => $request->user()->hasPermissionTo('manage_user')],
        ]);
    }

    public function store(AddressRequest $request, User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        $data = $request->validated();
        $data['is_primary'] = $request->boolean('is_primary');

        if ($data['is_primary']) {
            $user->addresses()->update(['is_primary' => false]);
        }

        $address = $user->addresses()->create($data);

        $this->activityLog->log('address.created', $address, "Menambahkan alamat '{$address->label}' untuk {$user->name}.");

        return Redirect::back()->with('success', 'Alamat ditambahkan.');
    }

    public function update(AddressRequest $request, User $user, Address $address): RedirectResponse
    {
        $this->authorize('update', $user);

        $data = $request->validated();
        $data['is_primary'] = $request->boolean('is_primary');

        if ($data['is_primary']) {
            $user->addresses()->whereKeyNot($address->id)->update(['is_primary' => false]);
        }

        $address->update($data);

        $this->activityLog->log('address.updated', $address, "Memperbarui alamat untuk {$user->name}.");

        return Redirect::back()->with('success', 'Alamat diperbarui.');
    }

    public function destroy(Request $request, User $user, Address $address): RedirectResponse
    {
        $this->authorize('update', $user);

        $address->delete();

        $this->activityLog->log('address.deleted', null, "Menghapus alamat untuk {$user->name}.");

        return Redirect::back()->with('success', 'Alamat dihapus.');
    }
}
