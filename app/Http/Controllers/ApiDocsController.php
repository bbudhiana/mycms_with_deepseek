<?php

namespace App\Http\Controllers;

use App\Support\ApiEndpointCatalog;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Route as RouteFacade;
use Inertia\Inertia;

class ApiDocsController extends Controller
{
    /**
     * Prefer a single canonical method for routes that register several
     * (GET|HEAD and PUT|PATCH).
     */
    private function canonicalMethod(array $methods): string
    {
        foreach (['GET', 'POST', 'PATCH', 'PUT', 'DELETE'] as $method) {
            if (in_array($method, $methods, true)) {
                return $method;
            }
        }

        return 'GET';
    }

    public function __invoke(Request $request)
    {
        $catalog = ApiEndpointCatalog::endpoints();

        $routes = collect(RouteFacade::getRoutes()->getRoutes())
            ->filter(fn (Route $route) => str_starts_with($route->uri(), 'api/'))
            ->map(fn (Route $route) => [
                'method' => $this->canonicalMethod($route->methods()),
                'path' => '/'.$route->uri(),
            ])
            ->unique(fn (array $route) => $route['method'].' '.$route['path'])
            ->values()
            ->map(fn (array $route) => array_merge($route, $this->catalogEntry($catalog, $route['method'].' '.$route['path'])))
            ->groupBy('group')
            ->mapWithKeys(function ($endpoints, $group) {
                return [
                    $group => [
                        'name' => $group,
                        'slug' => $this->slugify($group),
                        'endpoints' => $endpoints->values()->all(),
                    ],
                ];
            })
            ->sortBy(fn ($group, $key) => array_search($key, ApiEndpointCatalog::groups(), true))
            ->values()
            ->all();

        return Inertia::render('ApiDocs/Index', [
            'groups' => $routes,
            'flow' => ApiEndpointCatalog::flow(),
        ]);
    }

    /**
     * @param  array<string, array{
     *     group: string,
     *     description: string,
     *     permission?: string,
     *     params?: array<int, array{name: string, type: string, description: string}>,
     *     body?: array<int, array{name: string, type: string, required: bool, description: string}>,
     *     response?: string,
     *     status?: array<int, int>,
     *     notes?: array<int, string>
     * }>  $catalog
     * @return array{
     *     group: string,
     *     description: string,
     *     permission: string,
     *     params: array<int, array{name: string, type: string, description: string}>,
     *     body: array<int, array{name: string, type: string, required: bool, description: string}>,
     *     response: string|null,
     *     status: array<int, int>,
     *     notes: array<int, string>
     * }
     */
    private function catalogEntry(array $catalog, string $key): array
    {
        $entry = $catalog[$key] ?? [];

        return [
            'group' => $entry['group'] ?? $this->groupForPath($key),
            'description' => $entry['description'] ?? '',
            'permission' => $entry['permission'] ?? null,
            'params' => $entry['params'] ?? [],
            'body' => $entry['body'] ?? [],
            'response' => $entry['response'] ?? null,
            'status' => $entry['status'] ?? [],
            'notes' => $entry['notes'] ?? [],
        ];
    }

    private function groupForPath(string $key): string
    {
        $segment = explode(' ', $key)[1] ?? '';
        $resource = explode('/', trim($segment, '/'))[1] ?? '';

        return match ($resource) {
            'users' => 'Pengguna',
            'categories' => 'Kategori',
            'tags' => 'Tag',
            'media' => 'Media',
            'contents' => 'Konten',
            default => 'Lainnya',
        };
    }

    private function slugify(string $name): string
    {
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9]+/', '-', $name) ?? '', '-'));

        return $slug === '' ? 'umum' : $slug;
    }
}
