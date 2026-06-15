'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function SuccessPage() {
  const router = useRouter();
  const { updateUser, token } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }

    const syncPremiumStatus = async () => {
      try {
        // Fetch current profile to sync IsPremium state updated by Stripe checkout webhook
        const response = await api.get('/users/profile');
        if (response.data?.success && response.data?.data) {
          const profile = response.data.data;
          updateUser({
            isPremium: profile.isPremium,
            isVerified: profile.isVerified,
            displayName: profile.displayName || undefined,
            avatarUrl: profile.avatarUrl || undefined,
            bio: profile.bio || undefined,
            accountType: profile.accountType
          });
          
          if (profile.isPremium) {
            toast.success('Premium üyeliğiniz başarıyla etkinleştirildi!');
          }
        }
      } catch (error) {
        console.error('Failed to sync profile status:', error);
      } finally {
        setLoading(false);
      }
    };

    // Delay slightly to give the webhook time to process on the backend
    const timer = setTimeout(() => {
      syncPremiumStatus();
    }, 1500);

    return () => clearTimeout(timer);
  }, [token, updateUser, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-12 px-4 relative">
      {/* Visual background lights */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/10 rounded-full blur-[120px] pointer-events-none" />

      <Card className="max-w-md w-full border-white/10 bg-zinc-950/60 backdrop-blur-md text-center shadow-2xl relative overflow-hidden">
        <CardHeader className="pt-8 pb-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 border border-green-500/30 text-green-400 mb-4 relative">
            <CheckCircle2 className="h-10 w-10 animate-bounce" />
            <span className="absolute inset-0 rounded-full bg-green-500/20 blur-md -z-10 animate-ping" />
          </div>
          <CardTitle className="text-2xl font-extrabold text-white">Ödeme Başarılı!</CardTitle>
          <p className="text-zinc-400 text-sm mt-2">
            Aboneliğiniz başarıyla tamamlandı. AUTOGRAPH Premium dünyasına hoş geldiniz!
          </p>
        </CardHeader>

        <CardContent className="px-6 py-4 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-4 gap-2 text-xs text-zinc-500">
              <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
              <span>Abonelik durumu senkronize ediliyor...</span>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-left space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <span>Profilinizde <strong>PRO</strong> rozeti aktifleşti.</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <span>Sınırsız imza talepleri ve gelişmiş analizler açık.</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <span>BackOffice Dashboard erişimi tanımlandı.</span>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="pb-8 pt-4 px-6 flex flex-col gap-3">
          <Button 
            onClick={() => router.push('/feed')}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white cursor-pointer py-5 rounded-xl font-semibold shadow-lg shadow-violet-500/20"
          >
            {"Feed'e Dön"}
          </Button>
          <Button 
            variant="ghost"
            onClick={() => router.push(`/pricing`)}
            className="w-full text-zinc-500 hover:text-zinc-300 hover:bg-white/5 text-xs flex items-center justify-center gap-1 cursor-pointer"
          >
            Plan Detaylarını İncele <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
