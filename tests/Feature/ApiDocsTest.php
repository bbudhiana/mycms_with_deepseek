<?php

use App\Support\ApiEndpointCatalog;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the api docs with grouped endpoints and the publication flow', function () {
    actingAsRole('admin');

    $this->get('/api-docs')->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('ApiDocs/Index')
        ->has('groups', 6)
        ->where('groups.0.name', 'Pengguna')
        ->where('groups.0.slug', 'pengguna')
        ->where('groups.5.name', 'Konten — Workflow & Publikasi')
        ->has('flow', 5)
        ->where('flow.0.label', 'Kirim untuk review')
    );
});

it('documents the user role endpoint as POST', function () {
    actingAsRole('admin');

    $this->get('/api-docs')->assertInertia(fn (Assert $page) => $page
        ->where('groups.0.endpoints.5.method', 'POST')
        ->where('groups.0.endpoints.5.path', '/api/users/{user}/role')
        ->where('groups.0.endpoints.5.description', 'Ubah peran pengguna')
    );
});

it('exposes rich metadata for write endpoints', function () {
    actingAsRole('admin');

    $this->get('/api-docs')->assertInertia(fn (Assert $page) => $page
        ->where('groups.5.endpoints.5.description', 'Jadwalkan konten')
        ->where('groups.5.endpoints.5.body.0.name', 'scheduled_at')
        ->where('groups.5.endpoints.5.body.0.required', true)
        ->where('groups.5.endpoints.5.status.3', 422)
        ->where('groups.5.endpoints.5.permission', 'Menerbitkan konten')
    );
});

it('keeps the catalog in sync with the registered api routes', function () {
    $catalog = ApiEndpointCatalog::endpoints();

    $routes = collect(Route::getRoutes()->getRoutes())
        ->filter(fn ($route) => str_starts_with($route->uri(), 'api/'))
        ->map(function ($route) {
            $methods = $route->methods();
            foreach (['GET', 'POST', 'PATCH', 'PUT', 'DELETE'] as $method) {
                if (in_array($method, $methods, true)) {
                    return $method.' /'.$route->uri();
                }
            }

            return 'GET /'.$route->uri();
        })
        ->unique();

    $catalogKeys = collect(array_keys($catalog));

    expect($catalogKeys->diff($routes))->toBeEmpty()
        ->and($routes->diff($catalogKeys))->toBeEmpty()
        ->and($catalogKeys)->toHaveCount(43);
});

it('forbids access to the api docs for non-authenticated guests', function () {
    $this->get('/api-docs')->assertRedirect(route('login'));
});
