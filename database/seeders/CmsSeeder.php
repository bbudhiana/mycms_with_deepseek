<?php

namespace Database\Seeders;

use App\Enums\ContentStatus;
use App\Models\Category;
use App\Models\Content;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Database\Seeder;

class CmsSeeder extends Seeder
{
    public function run(): void
    {
        $tech = Category::firstOrCreate(['name' => 'Teknologi'], ['slug' => 'teknologi', 'description' => 'Berita seputar teknologi.']);
        $sport = Category::firstOrCreate(['name' => 'Olahraga'], ['slug' => 'olahraga', 'description' => 'Berita olahraga.']);
        $news = Category::firstOrCreate(['name' => 'Nasional'], ['slug' => 'nasional', 'description' => 'Berita nasional.']);

        Category::firstOrCreate(['name' => 'Gadget'], ['slug' => 'gadget', 'description' => 'Review dan berita gadget.', 'parent_id' => $tech->id]);
        Category::firstOrCreate(['name' => 'Sepak Bola'], ['slug' => 'sepak-bola', 'description' => 'Liga dalam dan luar negeri.', 'parent_id' => $sport->id]);

        $tags = ['polhukam', 'ekonomi', 'edukasi', 'kesehatan', 'hiburan'];
        $tagModels = collect($tags)->mapWithKeys(
            fn (string $tag) => [$tag => Tag::firstOrCreate(['name' => ucfirst($tag)], ['slug' => $tag])]
        );

        $author = User::where('email', 'author@mynews.test')->first() ?? User::factory()->create(['email' => 'author@mynews.test']);
        $editor = User::where('email', 'editor@mynews.test')->first() ?? User::factory()->create(['email' => 'editor@mynews.test']);

        $contents = [
            [
                'title' => 'Contoh Artikel Teknologi yang Telah Terbit',
                'slug' => 'contoh-artikel-teknologi',
                'category' => $tech,
                'status' => ContentStatus::Published,
                'tags' => ['ekonomi', 'edukasi'],
            ],
            [
                'title' => 'Draft Artikel untuk Author',
                'slug' => 'draft-artikel-untuk-author',
                'category' => $news,
                'status' => ContentStatus::Draft,
                'tags' => ['polhukam'],
            ],
            [
                'title' => 'Menunggu Review dari Editor',
                'slug' => 'menunggu-review-editor',
                'category' => $sport,
                'status' => ContentStatus::Review,
                'tags' => ['hiburan'],
            ],
            [
                'title' => 'Artikel Disetujui Siap Publikasi',
                'slug' => 'artikel-disetujui-siap-publikasi',
                'category' => $tech,
                'status' => ContentStatus::Approved,
                'tags' => ['ekonomi'],
            ],
        ];

        foreach ($contents as $data) {
            $content = Content::firstOrCreate(
                ['slug' => $data['slug']],
                [
                    'title' => $data['title'],
                    'sub_title' => 'Sub judul contoh',
                    'excerpt' => 'Ringkasan singkat dari artikel contoh.',
                    'body' => '<p>Ini adalah isi artikel contoh untuk menguji alur editorial pada MyNews CMS.</p><p>Paragraf kedua menjelaskan konteks lebih lanjut mengenai konten.</p>',
                    'category_id' => $data['category']->id,
                    'status' => $data['status'],
                    'author_id' => $author->id,
                    'reviewer_id' => ($data['status'] === ContentStatus::Published || $data['status'] === ContentStatus::Approved) ? $editor->id : null,
                    'reviewed_at' => ($data['status'] === ContentStatus::Published || $data['status'] === ContentStatus::Approved) ? now() : null,
                    'published_at' => $data['status'] === ContentStatus::Published ? now() : null,
                ]
            );

            $content->tags()->sync(
                collect($data['tags'])->mapWithKeys(fn (string $tag) => [$tagModels[$tag]->id => []])->all()
            );
        }
    }
}
