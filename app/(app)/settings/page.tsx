'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Check, Palette, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ThemeOption {
  key: string;
  name: string;
  description: string;
  bgClass: string;
  primaryClass: string;
  accentClass: string;
  borderClass: string;
  textColor: string;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  const themesList: ThemeOption[] = [
    {
      key: 'dark',
      name: 'Midnight Space (Varsayılan)',
      description: 'Uzay grisi ve asil mor detayların buluştuğu varsayılan modern karanlık tema.',
      bgClass: 'bg-[#1e1b29]',
      primaryClass: 'bg-violet-600',
      accentClass: 'bg-fuchsia-600',
      borderClass: 'border-violet-500/30',
      textColor: 'text-[#f5f5f7]',
    },
    {
      key: 'cyberpunk',
      name: 'Neon Cyberpunk',
      description: 'Saf siyah arka plan üzerinde göz alıcı magenta ve neon mavi detaylar.',
      bgClass: 'bg-[#140b1c]',
      primaryClass: 'bg-[#ff007f]',
      accentClass: 'bg-[#00f0ff]',
      borderClass: 'border-[#ff007f]/40',
      textColor: 'text-[#e5ff00]',
    },
    {
      key: 'emerald',
      name: 'Zümrüt Ormanı',
      description: 'Koyu yeşilin zarafeti ile parıldayan altın sarısı detayların kombinasyonu.',
      bgClass: 'bg-[#0b1c14]',
      primaryClass: 'bg-emerald-600',
      accentClass: 'bg-amber-500',
      borderClass: 'border-emerald-500/40',
      textColor: 'text-[#e2ffe2]',
    },
    {
      key: 'ocean',
      name: 'Okyanus Esintisi',
      description: 'Derin okyanus mavisi ile esintili deniz turkuazının ferah uyumu.',
      bgClass: 'bg-[#0b1424]',
      primaryClass: 'bg-cyan-500',
      accentClass: 'bg-teal-500',
      borderClass: 'border-cyan-500/40',
      textColor: 'text-[#e0f7fa]',
    },
    {
      key: 'rose-gold',
      name: 'Gül Altını',
      description: 'Burgonya zemin üzerinde lüks rose gold ve şampanya esintileri.',
      bgClass: 'bg-[#1c0b13]',
      primaryClass: 'bg-rose-500',
      accentClass: 'bg-amber-300',
      borderClass: 'border-rose-500/40',
      textColor: 'text-[#ffe8ed]',
    },
  ];

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-zinc-400 font-semibold flex items-center gap-2">
          <Palette className="h-5 w-5 animate-spin" />
          Yükleniyor...
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-8 animate-soft-fade max-w-4xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5 text-zinc-400">
          <Palette className="h-5 w-5 text-violet-500" />
          <span className="text-sm font-semibold tracking-wider uppercase">Kişiselleştirme</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
          Ayarlar
        </h1>
        <p className="text-zinc-400 text-sm max-w-xl">
          Uygulama görünümünü ve görsel kimliğini tarzınıza uygun 5 farklı premium temadan biriyle kişiselleştirin.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Themes Grid */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-violet-400" />
            Tema Seçenekleri
          </h2>

          <div className="space-y-4">
            {themesList.map((option) => {
              const isSelected = theme === option.key;

              return (
                <div
                  key={option.key}
                  onClick={() => setTheme(option.key)}
                  className={`group relative rounded-2xl border p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer transition-all duration-300 hover:scale-[1.01] bg-zinc-900/30 backdrop-blur-md ${
                    isSelected
                      ? 'border-violet-500 shadow-lg shadow-violet-500/5 bg-zinc-900/60'
                      : 'border-white/5 hover:border-white/10 hover:bg-zinc-900/40'
                  }`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base text-white group-hover:text-violet-400 transition-colors">
                        {option.name}
                      </h3>
                      {isSelected && (
                        <span className="flex items-center justify-center h-5 w-5 rounded-full bg-violet-600/20 border border-violet-500 text-violet-400">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
                      {option.description}
                    </p>
                  </div>

                  {/* Theme Palette Preview Swatch */}
                  <div className={`flex-shrink-0 flex items-center gap-2 p-2.5 rounded-xl border border-white/10 ${option.bgClass} shadow-inner`}>
                    <span className={`h-6 w-6 rounded-full border border-white/20 ${option.primaryClass} shadow-md`} title="Ana Renk" />
                    <span className={`h-6 w-6 rounded-full border border-white/20 ${option.accentClass} shadow-md`} title="Vurgu Rengi" />
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-black/40 border border-white/5 select-none" style={{ color: 'var(--foreground)' }}>
                      Aa
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Preview Console */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Palette className="h-4 w-4 text-violet-400" />
            Tema Önizlemesi
          </h2>

          <Card className="border-white/10 bg-zinc-900/30 backdrop-blur-lg shadow-2xl overflow-hidden rounded-2xl">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">Örnek Bileşenler</span>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Şu an aktif olan tema ayarlarına göre bileşenlerin renk dağılımı:
                </p>
              </div>

              {/* Fake Feed Card Mock */}
              <div className="rounded-xl border border-white/5 bg-card text-card-foreground p-4 space-y-3 shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs select-none">
                    AT
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">Artisan Token</h4>
                    <p className="text-[9px] text-muted-foreground">Şimdi yayınlandı</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed">
                  Özel dijital imzalar ve koleksiyonluk ürünler bu temada böyle görünecektir.
                </p>
                <div className="flex gap-2 pt-1.5">
                  <Button size="sm" className="bg-primary text-primary-foreground text-[10px] h-8 px-3 rounded-lg font-semibold cursor-pointer">
                    İncele
                  </Button>
                  <Button size="sm" variant="outline" className="border-white/10 hover:bg-white/5 text-[10px] h-8 px-3 rounded-lg font-semibold cursor-pointer">
                    Detaylar
                  </Button>
                </div>
              </div>

              {/* Fake Alert Box Mock */}
              <div className="rounded-xl border border-white/5 bg-zinc-950/40 p-4 flex gap-3 items-start">
                <div className="p-1 rounded-lg bg-violet-500/10 text-violet-500">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">Seçili Tema Değiştirildi</h4>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    Tema değişiklikleri tarayıcınızda kalıcı olarak saklanır ve anında tüm sayfalara yansır.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
