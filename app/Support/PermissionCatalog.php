<?php

namespace App\Support;

/**
 * Human-facing metadata for every permission in the CMS.
 */
class PermissionCatalog
{
    /**
     * @var array<string, array{label: string, group: string}>
     */
    private const DEFINITIONS = [
        'login' => ['label' => 'Masuk ke sistem', 'group' => 'Akses'],
        'create_content' => ['label' => 'Membuat konten', 'group' => 'Konten'],
        'edit_own_content' => ['label' => 'Mengedit konten sendiri', 'group' => 'Konten'],
        'edit_any_content' => ['label' => 'Mengedit semua konten', 'group' => 'Konten'],
        'approve_content' => ['label' => 'Menyetujui konten', 'group' => 'Konten'],
        'publish_content' => ['label' => 'Menerbitkan konten', 'group' => 'Konten'],
        'delete_content' => ['label' => 'Menghapus konten', 'group' => 'Konten'],
        'manage_category' => ['label' => 'Mengelola kategori', 'group' => 'Taksonomi'],
        'manage_tag' => ['label' => 'Mengelola tag', 'group' => 'Taksonomi'],
        'upload_media' => ['label' => 'Mengunggah media', 'group' => 'Media'],
        'manage_media' => ['label' => 'Mengelola media', 'group' => 'Media'],
        'manage_user' => ['label' => 'Mengelola pengguna', 'group' => 'Akses & Audit'],
        'change_role' => ['label' => 'Mengubah peran & izin', 'group' => 'Akses & Audit'],
        'view_analytics' => ['label' => 'Melihat analitik', 'group' => 'Akses & Audit'],
        'view_audit_log' => ['label' => 'Melihat log audit', 'group' => 'Akses & Audit'],
    ];

    /**
     * Display order of permission groups.
     *
     * @var array<int, string>
     */
    private const GROUPS = ['Akses', 'Konten', 'Taksonomi', 'Media', 'Akses & Audit'];

    /**
     * Permissions that grant elevated editorial or administrative power.
     *
     * @var array<int, string>
     */
    private const CRITICAL = [
        'approve_content',
        'publish_content',
        'delete_content',
        'manage_category',
        'manage_tag',
        'manage_media',
        'manage_user',
        'change_role',
        'view_audit_log',
    ];

    public static function label(string $permission): string
    {
        return self::DEFINITIONS[$permission]['label'] ?? $permission;
    }

    public static function group(string $permission): string
    {
        return self::DEFINITIONS[$permission]['group'] ?? 'Lainnya';
    }

    public static function isCritical(string $permission): bool
    {
        return in_array($permission, self::CRITICAL, true);
    }

    /**
     * @return array<int, string>
     */
    public static function groups(): array
    {
        return self::GROUPS;
    }
}
