<?php

namespace App\Enums;

enum ContentStatus: string
{
    case Draft = 'draft';
    case Review = 'review';
    case Approved = 'approved';
    case Published = 'published';
    case Archived = 'archived';

    /**
     * @return array<array{from: ContentStatus, to: ContentStatus}>
     */
    public static function allowedTransitions(): array
    {
        return [
            ['from' => self::Draft, 'to' => self::Review],
            ['from' => self::Review, 'to' => self::Approved],
            ['from' => self::Review, 'to' => self::Draft],
            ['from' => self::Approved, 'to' => self::Published],
            ['from' => self::Approved, 'to' => self::Draft],
            ['from' => self::Published, 'to' => self::Archived],
            ['from' => self::Archived, 'to' => self::Draft],
        ];
    }

    public static function canTransition(ContentStatus $from, ContentStatus $to): bool
    {
        foreach (self::allowedTransitions() as $transition) {
            if ($transition['from'] === $from && $transition['to'] === $to) {
                return true;
            }
        }

        return false;
    }

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Review => 'In Review',
            self::Approved => 'Approved',
            self::Published => 'Published',
            self::Archived => 'Archived',
        };
    }
}
