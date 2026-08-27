<?php

namespace App\Services;

use App\Enums\AiGeneratedContentStatus;
use App\Enums\AiScheduleStatus;
use App\Enums\ContentStatus;
use App\Models\AiGeneratedContent;
use App\Models\AiProviderSetting;
use App\Models\AiSchedule;
use App\Models\Content;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;

class AiAutopilotService
{
    public function __construct(
        private readonly AiProviderService $provider,
        private readonly AiImageService $image,
        private readonly ActivityLogService $activityLog,
    ) {}

    /**
     * Generate content for a schedule and record the outcome.
     *
     * @param  int|null  $triggeredBy  Actor for manual "run now"; null when run by the scheduler. Logged for audit only — does NOT become the content author.
     */
    public function run(AiSchedule $schedule, ?int $triggeredBy = null): void
    {
        if ($schedule->status === AiScheduleStatus::Running) {
            return;
        }

        // Naikkan batas eksekusi PHP untuk durasi sinkron ini agar PHP tidak
        // membunuh proses di tengah provider HTTP call (autosave/runNow).
        // Default 15s di development kurang untuk beberapa iterasi konten.
        @set_time_limit(180);

        $schedule->update(['status' => AiScheduleStatus::Running, 'last_error' => null]);

        try {
            $created = DB::transaction(function () use ($schedule) {
                $contents = [];

                for ($i = 0; $i < $schedule->content_count; $i++) {
                    $contents[] = $this->generateOne($schedule);
                }

                return $contents;
            });

            $schedule->update([
                'status' => AiScheduleStatus::Ok,
                'last_run_at' => now(),
            ]);

            foreach ($created as $content) {
                $this->activityLog->log('ai.content_generated', $content, "Autopilot '{$schedule->name}' membuat konten '{$content->title}'.");
            }
        } catch (RuntimeException $e) {
            $schedule->update([
                'status' => AiScheduleStatus::Failed,
                'last_run_at' => now(),
                'last_error' => $e->getMessage(),
            ]);
        }
    }

    private function generateOne(AiSchedule $schedule): Content
    {
        $settings = $this->provider->settings();

        if (! $settings) {
            throw new RuntimeException('Pengaturan AI belum dikonfigurasi.');
        }

        $content = $this->provider->complete([
            ['role' => 'system', 'content' => $this->systemPrompt($schedule)],
            ['role' => 'user', 'content' => $schedule->topic_direction],
        ]);

        $article = $this->parseArticle($content);
        $cleanBody = $this->cleanBody($article['body']);

        if (trim(strip_tags($cleanBody)) === '') {
            throw new RuntimeException('AI mengembalikan konten kosong.');
        }

        // Penulis konten selalu diambil dari schedule.author_id; bila tidak
        // di-set (mode "Super Admin default"), fallback ke super_admin pertama.
        // User yang memicu "Jalankan Sekarang" TIDAK menjadi penulis — mereka
        // hanya operator dan dicatat terpisah lewat audit log.
        $authorId = $schedule->author_id ?? $this->superAdminId();
        $status = $schedule->auto_publish ? ContentStatus::Published : ContentStatus::Draft;

        // Sub-judul tidak boleh sama dengan judul; fallback ke excerpt agar
        // kolom ini selalu terisi (konten editor lebih mudah ketika sub-judul
        // ada walau AI lupa).
        $subTitle = $article['sub_title'] ?? null;
        if ($subTitle === null || $subTitle === '' || mb_strtolower($subTitle) === mb_strtolower($article['title'])) {
            $subTitle = $this->firstSentence($article['excerpt']) ?? $article['title'];
        }

        $model = Content::create([
            'title' => $article['title'],
            'sub_title' => mb_substr($subTitle, 0, 255),
            'slug' => $this->uniqueSlug($article['title']),
            'excerpt' => $article['excerpt'] ?? null,
            'body' => $cleanBody,
            'status' => $status,
            'author_id' => $authorId,
            'category_id' => $schedule->category_id,
            'breaking_news_flag' => $article['breaking_news_flag'],
            'editor_pick_flag' => $article['editor_pick_flag'],
            'published_at' => $schedule->auto_publish ? now() : null,
        ]);

        $scheduleTags = $schedule->tags ?? [];
        $model->tags()->sync($scheduleTags);

        $image = null;

        if ($settings->image_enabled) {
            try {
                $image = $this->image->fetchFeaturedImage($article['title'], $authorId);
            } catch (RuntimeException $e) {
                // Image failure is non-fatal: content tetap dibuat tanpa featured
                // image, tapi kita catat ke log + schedule.last_error supaya
                // operator tahu kenapa gambar gagal di-unduh (key salah, rate
                // limit, dsb.).
                Log::warning('AI image fetch failed', [
                    'schedule_id' => $schedule->id,
                    'provider' => $settings->image_provider,
                    'error' => $e->getMessage(),
                ]);
                if (blank($schedule->last_error)) {
                    $schedule->forceFill(['last_error' => 'Gambar otomatis gagal: '.$e->getMessage()])->save();
                }
            }
        }

        if ($image) {
            // Thumbnail memakai gambar yang sama dengan featured image — tidak
            // ada unduhan kedua, tidak ada storage ganda.
            $captionBase = $this->firstSentence($article['excerpt'] ?? $subTitle) ?? '';
            $caption = trim('(Ilustrasi) '.$captionBase);

            $model->update([
                'featured_image_id' => $image->id,
                'thumbnail_id' => $image->id,
                'image_caption' => mb_substr($caption, 0, 250) ?: null,
                'image_credit' => $this->imageCreditFor($settings),
            ]);
        }

        $generatedStatus = $schedule->auto_publish
            ? AiGeneratedContentStatus::Published
            : AiGeneratedContentStatus::Draft;

        AiGeneratedContent::create([
            'content_id' => $model->id,
            'ai_schedule_id' => $schedule->id,
            'status' => $generatedStatus,
            'generated_at' => now(),
        ]);

        return $model;
    }

    private function systemPrompt(AiSchedule $schedule): string
    {
        return <<<PROMPT
Kamu adalah penulis berita profesional. Tulis satu artikel lengkap dalam bahasa {$schedule->language}
dengan gaya: {$schedule->tone->promptDescription()}

Artikel harus merupakan konten orisinal berdasarkan petunjuk arah topik dari user. Body artikel memakai HTML
dengan tag h2, p, strong, em, ul, li. Panjang 500–1200 kata.

Balas HANYA dengan JSON valid, tanpa teks lain, dengan skema:
{
  "title": "judul artikel, maksimal 90 karakter",
  "sub_title": "sub judul yang SELALU BERBEDA dari title, 1 kalimat, berisi ide gagasan utama konten",
  "excerpt": "ringkasan 1-2 kalimat",
  "body": "HTML artikel",
  "breaking_news_flag": boolean true jika konten ini layak jadi berita breaking/terkini yang sedang viral, false jika tidak",
  "editor_pick_flag": boolean true jika konten ini termasuk berita penting pilihan editor, false jika tidak
}

Aturan tambahan:
- sub_title WAJIB berbeda dari title (jangan copy-paste, beda wording).
- sub_title maksimal 100 karakter.
- breaking_news_flag: nilai true hanya jika berita bersifat terkini/baru/darurat dan layak disorot cepat.
- editor_pick_flag: nilai true hanya jika konten punya nilai penting/strategis untuk disorot editor.
PROMPT;
    }

    /**
     * @return array{title: string, sub_title: ?string, excerpt: ?string, body: string, breaking_news_flag: bool, editor_pick_flag: bool}
     */
    private function parseArticle(string $json): array
    {
        // Beberapa model LLM membungkus JSON dalam markdown code block
        // (`` ```json ... ``` ``) walau instruksi meminta JSON murni. Strip
        // wrapper sebelum decode.
        $stripped = trim($json);
        if (preg_match('/^```(?:json)?\s*\n?(.*?)\n?```\s*$/s', $stripped, $matches)) {
            $json = $matches[1];
        }

        $data = json_decode($json, true);

        if (! is_array($data) || blank($data['title'] ?? null) || blank($data['body'] ?? null)) {
            $preview = mb_substr(trim($json), 0, 500);

            throw new RuntimeException(
                'Respons AI tidak sesuai skema JSON. Respons mentah: '.
                ($preview === '' ? '(kosong)' : $preview),
            );
        }

        return [
            'title' => mb_substr(trim((string) $data['title']), 0, 255),
            'sub_title' => isset($data['sub_title']) && $data['sub_title'] !== ''
                ? mb_substr(trim((string) $data['sub_title']), 0, 255)
                : null,
            'excerpt' => isset($data['excerpt']) && $data['excerpt'] !== '' ? trim((string) $data['excerpt']) : null,
            'body' => (string) $data['body'],
            'breaking_news_flag' => (bool) ($data['breaking_news_flag'] ?? false),
            'editor_pick_flag' => (bool) ($data['editor_pick_flag'] ?? false),
        ];
    }

    private function firstSentence(?string $text): ?string
    {
        if ($text === null) {
            return null;
        }

        $clean = trim(preg_replace('/\s+/', ' ', strip_tags($text)));

        if ($clean === '') {
            return null;
        }

        // Ambil sampai batas kalimat pertama. Pola .?! Unicode-aware; gunakan
        // lookbehind agar delimiter tidak hilang saat string dipotong.
        if (preg_match('/^(.+?[.!?])(\s|$)/u', $clean, $matches)) {
            $sentence = trim($matches[1]);
        } else {
            $sentence = $clean;
        }

        // image_caption adalah varchar(255) — potong sebelum INSERT agar tidak
        // meledak di MySQL.
        return mb_substr($sentence, 0, 250) ?: null;
    }

    private function imageCreditFor(AiProviderSetting $settings): ?string
    {
        if (! $settings->image_enabled) {
            return null;
        }

        return match ($settings->image_provider) {
            'pexels' => 'Pexels',
            'unsplash' => 'Unsplash',
            'custom' => 'Custom Image Source',
            default => null,
        };
    }

    private function cleanBody(string $body): string
    {
        $purifier = app('purifier');

        return $purifier->clean($body, 'cms_content');
    }

    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title) ?: 'artikel';
        $slug = $base;
        $i = 2;

        while (Content::where('slug', $slug)->exists()) {
            $slug = $base.'-'.$i;
            $i++;
        }

        return $slug;
    }

    private function superAdminId(): ?int
    {
        return User::query()->role('super_admin')->value('id');
    }
}
