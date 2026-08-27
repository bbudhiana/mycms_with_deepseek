<?php

namespace App\Enums;

enum AiTone: string
{
    case Editorial = 'editorial';
    case Konvensional = 'konvensional';
    case Teknis = 'teknis';
    case Santai = 'santai';
    case Ceria = 'ceria';

    public function label(): string
    {
        return match ($this) {
            self::Editorial => 'Editorial',
            self::Konvensional => 'Konvensional',
            self::Teknis => 'Teknis',
            self::Santai => 'Santai',
            self::Ceria => 'Ceria',
        };
    }

    public function promptDescription(): string
    {
        return match ($this) {
            self::Editorial => 'Editorial: objektif, berbobot, mendalam, gaya jurnalistik profesional.',
            self::Konvensional => 'Konvensional: formal, netral, mengikuti kaidah penulisan berita standar.',
            self::Teknis => 'Teknis: detail, presisi, menggunakan istilah teknis yang akurat.',
            self::Santai => 'Santai: ringan, mudah dicerna, percakapan sehari-hari.',
            self::Ceria => 'Ceria: ceria, energik, optimis, bersemangat.',
        };
    }
}
