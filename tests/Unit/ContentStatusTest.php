<?php

use App\Enums\ContentStatus;

it('defines the full editorial status pipeline', function () {
    $statuses = collect(ContentStatus::cases())->map->value->all();

    expect($statuses)->toBe(['draft', 'review', 'approved', 'published', 'archived']);
});

it('permits only documented transitions', function () {
    expect(ContentStatus::canTransition(ContentStatus::Draft, ContentStatus::Review))->toBeTrue();
    expect(ContentStatus::canTransition(ContentStatus::Review, ContentStatus::Approved))->toBeTrue();
    expect(ContentStatus::canTransition(ContentStatus::Review, ContentStatus::Draft))->toBeTrue();
    expect(ContentStatus::canTransition(ContentStatus::Approved, ContentStatus::Published))->toBeTrue();
    expect(ContentStatus::canTransition(ContentStatus::Approved, ContentStatus::Draft))->toBeTrue();
    expect(ContentStatus::canTransition(ContentStatus::Published, ContentStatus::Archived))->toBeTrue();
    expect(ContentStatus::canTransition(ContentStatus::Archived, ContentStatus::Draft))->toBeTrue();
});

it('rejects invalid and skipped transitions', function () {
    expect(ContentStatus::canTransition(ContentStatus::Draft, ContentStatus::Published))->toBeFalse();
    expect(ContentStatus::canTransition(ContentStatus::Draft, ContentStatus::Approved))->toBeFalse();
    expect(ContentStatus::canTransition(ContentStatus::Review, ContentStatus::Published))->toBeFalse();
    expect(ContentStatus::canTransition(ContentStatus::Approved, ContentStatus::Review))->toBeFalse();
    expect(ContentStatus::canTransition(ContentStatus::Published, ContentStatus::Draft))->toBeFalse();
    expect(ContentStatus::canTransition(ContentStatus::Published, ContentStatus::Approved))->toBeFalse();
});

it('maps every status to a human label', function () {
    foreach (ContentStatus::cases() as $status) {
        expect($status->label())->not->toBeEmpty();
    }
});
