'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Sparkles, Loader2, Mail, CheckCircle2, ArrowRight, Shield, Heart, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Link from 'next/link';

export default function RootPage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [waitlistNumber, setWaitlistNumber] = useState<number | null>(null);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  useEffect(() => {
    if (mounted && token) {
      router.replace('/feed');
    }
  }, [mounted, token, router]);

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    setSubmitLoading(true);
    // Simulate API call for waitlist registration
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setSubmitLoading(false);
    setWaitlistNumber(Math.floor(Math.random() * 500) + 1240);
    setIsSubmitted(true);
    toast.success('Başarıyla waitlist sırasına alındınız!');
  };

  if (!mounted || token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col relative overflow-hidden">
      {/* Background ambient radial lights */}
      <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-fuchsia-600/10 blur-[150px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-white/5 relative z-10">
        <div 
          onClick={() => window.location.reload()} 
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 active:scale-95 transition-all select-none"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-extrabold text-lg tracking-wider text-white">AUTOGRAPH</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-xs sm:text-sm font-semibold text-zinc-400 hover:text-white cursor-pointer px-2 sm:px-4 h-8 sm:h-10 active:scale-95 transition-all duration-150">
              Giriş Yap
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs sm:text-sm font-semibold px-3 py-1.5 sm:px-5 sm:py-2.5 h-8 sm:h-11 rounded-lg sm:rounded-xl cursor-pointer shadow-lg shadow-violet-500/10 active:scale-95 transition-all duration-150">
              Kayıt Ol
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Hero & Content Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 flex flex-col items-center justify-center py-16 relative z-10 text-center space-y-12 animate-soft-fade">
        
        {/* Banner Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-semibold text-violet-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>AUTOGRAPH v2.0 Çok Yakında</span>
        </div>

        {/* Hero Copy */}
        <div className="max-w-3xl space-y-4">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent leading-tight">
            Dijital Eserlerinizi <br/>
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Kriptografik İmzalar</span> ile Sertifikalayın
          </h1>
          <p className="text-zinc-400 text-base sm:text-xl max-w-2xl mx-auto leading-relaxed">
            AUTOGRAPH, sanatçıların ve içerik üreticilerinin dijital koleksiyonlerini benzersiz, kırılamaz kriptografik imzalar ile damgalayıp hayranlarıyla güven içinde paylaşmasını sağlar.
          </p>
        </div>

        {/* Waitlist Subscription Block */}
        <div className="w-full max-w-lg mx-auto bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
          
          {isSubmitted ? (
            <div className="space-y-4 py-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 border border-green-500/30 text-green-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Sıraya Alındınız!</h3>
              <p className="text-zinc-400 text-xs leading-relaxed max-w-xs mx-auto">
                Erken erişim sıranız başarıyla onaylandı. Platform yayına girdiği an öncelikli olarak bilgilendirileceksiniz.
              </p>
              <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[11px] font-mono text-violet-400">
                Sıranız: #{waitlistNumber}
              </div>
            </div>
          ) : (
            <form onSubmit={handleJoinWaitlist} className="space-y-4">
              <div className="text-left space-y-1">
                <h3 className="text-md font-bold text-white flex items-center gap-2">
                  <Mail className="h-4 w-4 text-violet-400" />
                  Erken Erişim Sırasına Katılın
                </h3>
                <p className="text-zinc-400 text-xs">
                  Sınırlı kontenjana sahip beta sürümünde yerinizi ayırtın.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-posta adresiniz"
                  required
                  className="h-12 bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus-visible:border-violet-500 focus-visible:ring-violet-500/30 rounded-xl flex-1"
                />
                <Button 
                  type="submit" 
                  disabled={submitLoading}
                  className="bg-white hover:bg-zinc-200 text-black h-12 px-6 rounded-xl font-bold transition-all duration-300 active:scale-95 cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
                >
                  {submitLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Yer Ayırt <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-zinc-500 text-left">
                * Gizliliğe önem veriyoruz. Asla spam gönderilmez.
              </p>
            </form>
          )}
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-12">
          <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center space-y-3 hover:border-white/10 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-sm text-white">Güvenli Kriptografi</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Her dijital imza, değiştirilemez hash algoritmalarıyla imzalanır ve doğrulanabilir ownership kanıtı sağlar.
            </p>
          </div>
          <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center space-y-3 hover:border-white/10 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
              <Heart className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-sm text-white">Sanatçı & Hayran Bağı</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Hayranlar, sevdikleri sanatçılardan doğrudan dijital imza isteyebilir, özel koleksiyon oluşturabilirler.
            </p>
          </div>
          <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center space-y-3 hover:border-white/10 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
              <Fingerprint className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-sm text-white">Özel PRO Avantajları</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Premium aboneler sınırsız istek, özel profil rozeti, BackOffice analizleri ve daha birçok ayrıcalığa erişir.
            </p>
          </div>
        </div>

      </main>

      {/* Simple Footer */}
      <footer className="w-full text-center py-6 text-xs text-zinc-600 border-t border-white/5 mt-auto relative z-10">
        &copy; 2026 AUTOGRAPH. Tüm Hakları Saklıdır.
      </footer>
    </div>
  );
}
