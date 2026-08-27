<?php

namespace App\Enums;

enum AiScheduleStatus: string
{
    case Idle = 'idle';
    case Running = 'running';
    case Ok = 'ok';
    case Failed = 'failed';

    public function label(): string
    {
        return match ($this) {
            self::Idle => 'Idle',
            self::Running => 'Running',
            self::Ok => 'Berhasil',
            self::Failed => 'Gagal',
        };
    }
}
