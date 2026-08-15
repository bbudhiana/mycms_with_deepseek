<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class ApiDocsController extends Controller
{
    public function __invoke(Request $request)
    {
        return Inertia::render('ApiDocs/Index', [
            'user' => $request->user(),
        ]);
    }
}
