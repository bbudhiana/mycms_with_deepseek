<?php

namespace App\Enums;

enum AiGeneratedContentStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Failed = 'failed';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Published => 'Published',
            self::Failed => 'Gagal',
        };
    }
}
