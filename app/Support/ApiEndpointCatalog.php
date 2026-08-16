<?php

namespace App\Support;

/**
 * Single source of truth for the API documentation metadata.
 *
 * Every key must match a real route from `routes/api.php` ("METHOD /path").
 * The drift between this catalog and the actual routes is verified by a test.
 */
class ApiEndpointCatalog
{
    /**
     * @var array<int, string>
     */
    private const GROUPS = ['Pengguna', 'Kategori', 'Tag', 'Media', 'Konten', 'Konten — Workflow & Publikasi'];

    /**
     * @var array<string, array{
     *     group: string,
     *     description: string,
     *     permission?: string,
     *     params?: array<int, array{name: string, type: string, description: string}>,
     *     body?: array<int, array{name: string, type: string, required: bool, description: string}>,
     *     response?: string,
     *     status?: array<int, int>,
     *     notes?: array<int, string>
     * }>
     */
    private const ENDPOINTS = [
        'GET /api/users' => [
            'group' => 'Pengguna',
            'description' => 'Daftar pengguna',
            'permission' => 'Kelola pengguna',
            'params' => [
                ['name' => 'search', 'type' => 'string', 'description' => 'Cari berdasarkan nama atau email'],
                ['name' => 'role', 'type' => 'string', 'description' => 'Filter peran (mis. editor, author, all)'],
                ['name' => 'per_page', 'type' => 'int', 'description' => 'Jumlah per halaman (bawaan 20)'],
            ],
            'response' => '{"data":[{"id":1,"name":"Budi","email":"budi@redaksi.id","roles":["author"]}],"links":{}}',
            'status' => [200, 403],
        ],
        'POST /api/users' => [
            'group' => 'Pengguna',
            'description' => 'Buat pengguna',
            'permission' => 'Kelola pengguna',
            'body' => [
                ['name' => 'name', 'type' => 'string', 'required' => true, 'description' => 'Nama lengkap'],
                ['name' => 'email', 'type' => 'email', 'required' => true, 'description' => 'Email unik'],
                ['name' => 'password', 'type' => 'string', 'required' => false, 'description' => 'Min. 8 karakter; diacak otomatis bila kosong'],
                ['name' => 'job_title', 'type' => 'string', 'required' => false, 'description' => 'Jabatan'],
                ['name' => 'bio', 'type' => 'string', 'required' => false, 'description' => 'Biografi singkat'],
                ['name' => 'is_active', 'type' => 'boolean', 'required' => false, 'description' => 'Status aktif'],
                ['name' => 'roles', 'type' => 'string[]', 'required' => true, 'description' => 'Daftar peran (mis. ["author"])'],
            ],
            'response' => '{"data":{"id":5,"name":"Budi","email":"budi@redaksi.id","roles":["author"]}}',
            'status' => [201, 403, 422],
        ],
        'GET /api/users/{user}' => [
            'group' => 'Pengguna',
            'description' => 'Detail pengguna',
            'permission' => 'Kelola pengguna',
            'response' => '{"data":{"id":1,"name":"Budi","email":"budi@redaksi.id","roles":["author"]}}',
            'status' => [200, 403, 404],
        ],
        'PATCH /api/users/{user}' => [
            'group' => 'Pengguna',
            'description' => 'Perbarui pengguna',
            'permission' => 'Kelola pengguna',
            'body' => [
                ['name' => 'name', 'type' => 'string', 'required' => false, 'description' => 'Nama lengkap'],
                ['name' => 'email', 'type' => 'email', 'required' => false, 'description' => 'Email unik'],
                ['name' => 'password', 'type' => 'string', 'required' => false, 'description' => 'Min. 8 karakter'],
                ['name' => 'roles', 'type' => 'string[]', 'required' => false, 'description' => 'Daftar peran pengguna'],
            ],
            'response' => '{"data":{"id":1,"name":"Budi","email":"budi@redaksi.id","roles":["editor"]}}',
            'status' => [200, 403, 404, 422],
        ],
        'DELETE /api/users/{user}' => [
            'group' => 'Pengguna',
            'description' => 'Hapus pengguna',
            'permission' => 'Kelola pengguna',
            'notes' => ['Tidak dapat menghapus akun sendiri'],
            'response' => '{"message":"User deleted."}',
            'status' => [200, 403, 404],
        ],
        'POST /api/users/{user}/role' => [
            'group' => 'Pengguna',
            'description' => 'Ubah peran pengguna',
            'permission' => 'Ubah peran & izin',
            'body' => [
                ['name' => 'role', 'type' => 'string', 'required' => true, 'description' => 'Nama peran (mis. editor)'],
            ],
            'response' => '{"message":"Role updated.","roles":["editor"]}',
            'status' => [200, 403, 404, 422],
        ],
        'POST /api/users/{user}/activate' => [
            'group' => 'Pengguna',
            'description' => 'Aktifkan pengguna',
            'permission' => 'Kelola pengguna',
            'response' => '{"message":"User activated."}',
            'status' => [200, 403, 404],
        ],
        'POST /api/users/{user}/deactivate' => [
            'group' => 'Pengguna',
            'description' => 'Nonaktifkan pengguna',
            'permission' => 'Kelola pengguna',
            'notes' => ['Tidak dapat menonaktifkan akun sendiri'],
            'response' => '{"message":"User deactivated."}',
            'status' => [200, 403, 404],
        ],
        'GET /api/users/{user}/addresses' => [
            'group' => 'Pengguna',
            'description' => 'Daftar alamat pengguna',
            'permission' => 'Kelola pengguna',
            'response' => '{"data":[{"id":1,"label":"Kantor","address_line1":"Jl. Merdeka 1","city":"Jakarta"}]}',
            'status' => [200, 403, 404],
        ],
        'POST /api/users/{user}/addresses' => [
            'group' => 'Pengguna',
            'description' => 'Tambah alamat pengguna',
            'permission' => 'Kelola pengguna',
            'body' => [
                ['name' => 'address_line1', 'type' => 'string', 'required' => true, 'description' => 'Alamat utama'],
                ['name' => 'label', 'type' => 'string', 'required' => false, 'description' => 'Label (mis. Kantor)'],
                ['name' => 'city', 'type' => 'string', 'required' => false, 'description' => 'Kota'],
                ['name' => 'state', 'type' => 'string', 'required' => false, 'description' => 'Provinsi'],
                ['name' => 'postal_code', 'type' => 'string', 'required' => false, 'description' => 'Kode pos'],
                ['name' => 'country', 'type' => 'string', 'required' => false, 'description' => 'Negara'],
                ['name' => 'is_primary', 'type' => 'boolean', 'required' => false, 'description' => 'Jadikan alamat utama'],
            ],
            'response' => '{"data":{"id":1,"label":"Kantor","city":"Jakarta"}}',
            'status' => [201, 403, 404, 422],
        ],

        'GET /api/categories/tree' => [
            'group' => 'Kategori',
            'description' => 'Pohon hierarki kategori',
            'permission' => 'Terautentikasi',
            'response' => '{"data":[{"id":1,"name":"Nasional","children":[{"id":2,"name":"Politik"}]}]}',
            'status' => [200],
        ],
        'GET /api/categories' => [
            'group' => 'Kategori',
            'description' => 'Daftar kategori',
            'permission' => 'Terautentikasi',
            'params' => [
                ['name' => 'per_page', 'type' => 'int', 'description' => 'Jumlah per halaman (bawaan 20)'],
            ],
            'response' => '{"data":[{"id":1,"name":"Nasional","slug":"nasional"}],"links":{}}',
            'status' => [200],
        ],
        'POST /api/categories' => [
            'group' => 'Kategori',
            'description' => 'Buat kategori',
            'permission' => 'Kelola kategori',
            'body' => [
                ['name' => 'name', 'type' => 'string', 'required' => true, 'description' => 'Nama kategori'],
                ['name' => 'slug', 'type' => 'string', 'required' => false, 'description' => 'Slug unik'],
                ['name' => 'description', 'type' => 'string', 'required' => false, 'description' => 'Deskripsi'],
                ['name' => 'parent_id', 'type' => 'int', 'required' => false, 'description' => 'ID kategori induk'],
            ],
            'response' => '{"data":{"id":3,"name":"Ekonomi","slug":"ekonomi"}}',
            'status' => [201, 403, 422],
        ],
        'GET /api/categories/{category}' => [
            'group' => 'Kategori',
            'description' => 'Detail kategori',
            'permission' => 'Terautentikasi',
            'response' => '{"data":{"id":1,"name":"Nasional","slug":"nasional","parent_id":null}}',
            'status' => [200, 404],
        ],
        'PATCH /api/categories/{category}' => [
            'group' => 'Kategori',
            'description' => 'Perbarui kategori',
            'permission' => 'Kelola kategori',
            'body' => [
                ['name' => 'name', 'type' => 'string', 'required' => false, 'description' => 'Nama kategori'],
                ['name' => 'slug', 'type' => 'string', 'required' => false, 'description' => 'Slug unik'],
                ['name' => 'description', 'type' => 'string', 'required' => false, 'description' => 'Deskripsi'],
                ['name' => 'parent_id', 'type' => 'int', 'required' => false, 'description' => 'ID kategori induk'],
            ],
            'notes' => ['Kategori tidak dapat menjadi induk dari dirinya sendiri'],
            'response' => '{"data":{"id":1,"name":"Nusantara","slug":"nusantara"}}',
            'status' => [200, 403, 404, 422],
        ],
        'DELETE /api/categories/{category}' => [
            'group' => 'Kategori',
            'description' => 'Hapus kategori',
            'permission' => 'Kelola kategori',
            'response' => '{"message":"Category deleted."}',
            'status' => [200, 403, 404],
        ],

        'GET /api/tags/search' => [
            'group' => 'Tag',
            'description' => 'Cari tag',
            'permission' => 'Terautentikasi',
            'params' => [
                ['name' => 'q', 'type' => 'string', 'description' => 'Kata kunci pencarian'],
            ],
            'response' => '{"data":[{"id":1,"name":"Olahraga","slug":"olahraga"}]}',
            'status' => [200],
        ],
        'GET /api/tags' => [
            'group' => 'Tag',
            'description' => 'Daftar tag',
            'permission' => 'Terautentikasi',
            'params' => [
                ['name' => 'per_page', 'type' => 'int', 'description' => 'Jumlah per halaman (bawaan 20)'],
            ],
            'response' => '{"data":[{"id":1,"name":"Olahraga","slug":"olahraga"}],"links":{}}',
            'status' => [200],
        ],
        'POST /api/tags' => [
            'group' => 'Tag',
            'description' => 'Buat tag',
            'permission' => 'Kelola tag',
            'body' => [
                ['name' => 'name', 'type' => 'string', 'required' => true, 'description' => 'Nama tag'],
                ['name' => 'slug', 'type' => 'string', 'required' => false, 'description' => 'Slug unik'],
            ],
            'response' => '{"data":{"id":2,"name":"Kesehatan","slug":"kesehatan"}}',
            'status' => [201, 403, 422],
        ],
        'GET /api/tags/{tag}' => [
            'group' => 'Tag',
            'description' => 'Detail tag',
            'permission' => 'Terautentikasi',
            'response' => '{"data":{"id":1,"name":"Olahraga","slug":"olahraga"}}',
            'status' => [200, 404],
        ],
        'PATCH /api/tags/{tag}' => [
            'group' => 'Tag',
            'description' => 'Perbarui tag',
            'permission' => 'Kelola tag',
            'body' => [
                ['name' => 'name', 'type' => 'string', 'required' => false, 'description' => 'Nama tag'],
                ['name' => 'slug', 'type' => 'string', 'required' => false, 'description' => 'Slug unik'],
            ],
            'response' => '{"data":{"id":1,"name":"Olahraga","slug":"olahraga"}}',
            'status' => [200, 403, 404, 422],
        ],
        'DELETE /api/tags/{tag}' => [
            'group' => 'Tag',
            'description' => 'Hapus tag',
            'permission' => 'Kelola tag',
            'response' => '{"message":"Tag deleted."}',
            'status' => [200, 403, 404],
        ],

        'GET /api/media' => [
            'group' => 'Media',
            'description' => 'Daftar media',
            'permission' => 'Kelola / unggah media',
            'params' => [
                ['name' => 'per_page', 'type' => 'int', 'description' => 'Jumlah per halaman (bawaan 24)'],
            ],
            'response' => '{"data":[{"id":1,"alt_text":"Gedung","url":"/storage/media/...jpg"}],"links":{}}',
            'status' => [200, 403],
        ],
        'POST /api/media' => [
            'group' => 'Media',
            'description' => 'Unggah media',
            'permission' => 'Unggah media',
            'body' => [
                ['name' => 'file', 'type' => 'file', 'required' => true, 'description' => 'jpg/jpeg/png/webp/gif/svg/pdf, maks. 10MB'],
                ['name' => 'alt_text', 'type' => 'string', 'required' => false, 'description' => 'Teks alternatif'],
            ],
            'notes' => ['Multipart/form-data', 'Rate limit: 20 unggahan/menit'],
            'response' => '{"data":{"id":1,"alt_text":"Gedung","url":"/storage/media/...jpg"}}',
            'status' => [201, 403, 422, 429],
        ],
        'GET /api/media/{media}' => [
            'group' => 'Media',
            'description' => 'Detail media',
            'permission' => 'Kelola / unggah media',
            'response' => '{"data":{"id":1,"alt_text":"Gedung","url":"/storage/media/...jpg"}}',
            'status' => [200, 403, 404],
        ],
        'PATCH /api/media/{media}' => [
            'group' => 'Media',
            'description' => 'Perbarui media (alt text)',
            'permission' => 'Kelola / unggah media',
            'body' => [
                ['name' => 'alt_text', 'type' => 'string', 'required' => true, 'description' => 'Teks alternatif baru'],
            ],
            'response' => '{"data":{"id":1,"alt_text":"Gedung utama","url":"/storage/media/...jpg"}}',
            'status' => [200, 403, 404, 422],
        ],
        'DELETE /api/media/{media}' => [
            'group' => 'Media',
            'description' => 'Hapus media',
            'permission' => 'Kelola / unggah media',
            'response' => '{"message":"Media deleted."}',
            'status' => [200, 403, 404],
        ],

        'GET /api/contents/pending-review' => [
            'group' => 'Konten',
            'description' => 'Konten menunggu review',
            'permission' => 'Terautentikasi',
            'response' => '{"data":[{"id":10,"title":"Cuaca Ekstrem","status":"review"}]}',
            'status' => [200],
        ],
        'GET /api/contents/scheduled' => [
            'group' => 'Konten',
            'description' => 'Konten terjadwal',
            'permission' => 'Terautentikasi',
            'response' => '{"data":[{"id":11,"title":"Wawancara Khusus","status":"scheduled","published_at":"2026-08-18T08:00:00Z"}]}',
            'status' => [200],
        ],
        'GET /api/contents/{content}/approval-history' => [
            'group' => 'Konten',
            'description' => 'Riwayat persetujuan konten',
            'permission' => 'Terautentikasi',
            'response' => '{"data":[{"action":"submitted","user":{"name":"Budi"},"created_at":"2026-08-16T10:00:00Z"}]}',
            'status' => [200, 404],
        ],
        'GET /api/contents' => [
            'group' => 'Konten',
            'description' => 'Daftar konten',
            'permission' => 'Terautentikasi',
            'notes' => ['Penulis non-editorial hanya melihat konten miliknya'],
            'params' => [
                ['name' => 'search', 'type' => 'string', 'description' => 'Cari berdasarkan judul'],
                ['name' => 'status', 'type' => 'string', 'description' => 'Filter status (draft, review, approved, published, archived, all)'],
                ['name' => 'per_page', 'type' => 'int', 'description' => 'Jumlah per halaman (bawaan 15)'],
            ],
            'response' => '{"data":[{"id":10,"title":"Cuaca Ekstrem","status":"published"}],"links":{}}',
            'status' => [200],
        ],
        'POST /api/contents' => [
            'group' => 'Konten',
            'description' => 'Buat konten',
            'permission' => 'Membuat konten',
            'body' => [
                ['name' => 'title', 'type' => 'string', 'required' => true, 'description' => 'Judul berita'],
                ['name' => 'body', 'type' => 'string', 'required' => true, 'description' => 'Isi berita (HTML)'],
                ['name' => 'slug', 'type' => 'string', 'required' => false, 'description' => 'Slug unik'],
                ['name' => 'sub_title', 'type' => 'string', 'required' => false, 'description' => 'Sub-judul'],
                ['name' => 'excerpt', 'type' => 'string', 'required' => false, 'description' => 'Ringkasan'],
                ['name' => 'category_id', 'type' => 'int', 'required' => false, 'description' => 'ID kategori'],
                ['name' => 'tags', 'type' => 'int[]', 'required' => false, 'description' => 'Daftar ID tag'],
                ['name' => 'featured_image_id', 'type' => 'int', 'required' => false, 'description' => 'ID media gambar utama'],
                ['name' => 'thumbnail_id', 'type' => 'int', 'required' => false, 'description' => 'ID media thumbnail'],
                ['name' => 'breaking_news_flag', 'type' => 'boolean', 'required' => false, 'description' => 'Tandai sebagai berita terkini'],
                ['name' => 'editor_pick_flag', 'type' => 'boolean', 'required' => false, 'description' => 'Tandai sebagai pilihan redaksi'],
            ],
            'response' => '{"data":{"id":10,"title":"Cuaca Ekstrem","status":"draft"}}',
            'status' => [201, 403, 422],
        ],
        'GET /api/contents/{content}' => [
            'group' => 'Konten',
            'description' => 'Detail konten',
            'permission' => 'Terautentikasi',
            'response' => '{"data":{"id":10,"title":"Cuaca Ekstrem","status":"draft","author":{"name":"Budi"}}}',
            'status' => [200, 403, 404],
        ],
        'PATCH /api/contents/{content}' => [
            'group' => 'Konten',
            'description' => 'Perbarui konten',
            'permission' => 'Mengedit konten',
            'notes' => ['Hanya konten berstatus draft yang dapat diedit'],
            'body' => [
                ['name' => 'title', 'type' => 'string', 'required' => false, 'description' => 'Judul berita'],
                ['name' => 'body', 'type' => 'string', 'required' => false, 'description' => 'Isi berita (HTML)'],
                ['name' => 'category_id', 'type' => 'int', 'required' => false, 'description' => 'ID kategori'],
                ['name' => 'tags', 'type' => 'int[]', 'required' => false, 'description' => 'Daftar ID tag'],
            ],
            'response' => '{"data":{"id":10,"title":"Cuaca Ekstrem Diperbarui","status":"draft"}}',
            'status' => [200, 403, 404, 422],
        ],
        'DELETE /api/contents/{content}' => [
            'group' => 'Konten',
            'description' => 'Hapus konten',
            'permission' => 'Menghapus konten',
            'notes' => ['Konten terbit/ter-setujui tidak dapat dihapus'],
            'response' => '{"message":"Content deleted."}',
            'status' => [200, 403, 404],
        ],

        'POST /api/contents/{content}/submit' => [
            'group' => 'Konten — Workflow & Publikasi',
            'description' => 'Kirim konten untuk review',
            'permission' => 'Mengedit konten sendiri',
            'notes' => ['Hanya pemilik konten draft'],
            'response' => '{"message":"Content submitted for review.","content_id":10}',
            'status' => [200, 403, 404, 422],
        ],
        'POST /api/contents/{content}/approve' => [
            'group' => 'Konten — Workflow & Publikasi',
            'description' => 'Setujui konten',
            'permission' => 'Menyetujui konten',
            'body' => [
                ['name' => 'notes', 'type' => 'string', 'required' => false, 'description' => 'Catatan persetujuan'],
            ],
            'notes' => ['Penulis tidak dapat menyetujui kontennya sendiri'],
            'response' => '{"message":"Content approved.","content_id":10}',
            'status' => [200, 403, 404, 422],
        ],
        'POST /api/contents/{content}/reject' => [
            'group' => 'Konten — Workflow & Publikasi',
            'description' => 'Tolak konten',
            'permission' => 'Menyetujui konten',
            'body' => [
                ['name' => 'notes', 'type' => 'string', 'required' => true, 'description' => 'Alasan penolakan'],
            ],
            'response' => '{"message":"Content rejected.","content_id":10}',
            'status' => [200, 403, 404, 422],
        ],
        'POST /api/contents/{content}/request-changes' => [
            'group' => 'Konten — Workflow & Publikasi',
            'description' => 'Minta perubahan',
            'permission' => 'Menyetujui konten',
            'body' => [
                ['name' => 'notes', 'type' => 'string', 'required' => true, 'description' => 'Catatan perubahan yang diminta'],
            ],
            'response' => '{"message":"Changes requested.","content_id":10}',
            'status' => [200, 403, 404, 422],
        ],
        'POST /api/contents/{content}/publish' => [
            'group' => 'Konten — Workflow & Publikasi',
            'description' => 'Terbitkan konten',
            'permission' => 'Menerbitkan konten',
            'notes' => ['Konten harus berstatus approved'],
            'response' => '{"message":"Content published.","content_id":10}',
            'status' => [200, 403, 404],
        ],
        'POST /api/contents/{content}/schedule' => [
            'group' => 'Konten — Workflow & Publikasi',
            'description' => 'Jadwalkan konten',
            'permission' => 'Menerbitkan konten',
            'body' => [
                ['name' => 'scheduled_at', 'type' => 'datetime (ISO 8601)', 'required' => true, 'description' => 'Waktu tayang, harus di masa depan'],
            ],
            'response' => '{"message":"Publication scheduled.","schedule_id":7}',
            'status' => [200, 403, 404, 422],
        ],
        'POST /api/contents/{content}/unpublish' => [
            'group' => 'Konten — Workflow & Publikasi',
            'description' => 'Batalkan publikasi',
            'permission' => 'Menerbitkan konten',
            'notes' => ['Hanya konten berstatus published'],
            'response' => '{"message":"Content unpublished.","content_id":10}',
            'status' => [200, 403, 404],
        ],
        'POST /api/contents/{content}/archive' => [
            'group' => 'Konten — Workflow & Publikasi',
            'description' => 'Arsipkan konten',
            'permission' => 'Menerbitkan konten',
            'notes' => ['Hanya konten berstatus published'],
            'response' => '{"message":"Content archived.","content_id":10}',
            'status' => [200, 403, 404],
        ],
    ];

    /**
     * Editorial publication flow shown as the signature stepper.
     *
     * @var array<int, array{label: string, method: string, path: string, description: string}>
     */
    private const FLOW = [
        ['label' => 'Kirim untuk review', 'method' => 'POST', 'path' => '/api/contents/{content}/submit', 'description' => 'Draft dikirim ke alur review'],
        ['label' => 'Setujui atau tolak', 'method' => 'POST', 'path' => '/api/contents/{content}/approve', 'description' => 'Editor menilai konten'],
        ['label' => 'Terbitkan', 'method' => 'POST', 'path' => '/api/contents/{content}/publish', 'description' => 'Konten tayang langsung'],
        ['label' => 'Jadwalkan', 'method' => 'POST', 'path' => '/api/contents/{content}/schedule', 'description' => 'Tayang di waktu tertentu'],
        ['label' => 'Arsipkan', 'method' => 'POST', 'path' => '/api/contents/{content}/archive', 'description' => 'Konten diarsipkan'],
    ];

    /**
     * @return array<int, string>
     */
    public static function groups(): array
    {
        return self::GROUPS;
    }

    /**
     * @return array<string, array{
     *     group: string,
     *     description: string,
     *     permission?: string,
     *     params?: array<int, array{name: string, type: string, description: string}>,
     *     body?: array<int, array{name: string, type: string, required: bool, description: string}>,
     *     response?: string,
     *     status?: array<int, int>,
     *     notes?: array<int, string>
     * }>
     */
    public static function endpoints(): array
    {
        return self::ENDPOINTS;
    }

    /**
     * @return array<int, array{label: string, method: string, path: string, description: string}>
     */
    public static function flow(): array
    {
        return self::FLOW;
    }
}
