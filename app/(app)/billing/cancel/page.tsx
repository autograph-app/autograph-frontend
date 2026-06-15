'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function CancelPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-12 px-4 relative">
      {/* Visual background lights */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />

      <Card className="max-w-md w-full border-white/10 bg-zinc-950/60 backdrop-blur-md text-center shadow-2xl relative overflow-hidden">
        <CardHeader className="pt-8 pb-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-4">
            <XCircle className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl font-extrabold text-white">Ödeme İptal Edildi</CardTitle>
          <p className="text-zinc-400 text-sm mt-2">
            Ödeme işlemi iptal edildi veya işlem tamamlanamadı. Hesabınızdan herhangi bir ücret tahsil edilmemiştir.
          </p>
        </CardHeader>

        <CardContent className="px-6 py-4">
          <p className="text-xs text-zinc-500 leading-relaxed">
            Eğer bir hata oluştuğunu düşünüyorsanız veya ödeme yönteminizi değiştirmek isterseniz aşağıdaki butonlardan fiyatlandırma sayfasına geri dönebilirsiniz.
          </p>
        </CardContent>

        <CardFooter className="pb-8 pt-4 px-6 flex flex-col gap-3">
          <Button 
            onClick={() => router.push('/pricing')}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white cursor-pointer py-5 rounded-xl font-semibold shadow-lg shadow-violet-500/20"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Tekrar Dene
          </Button>
          <Button 
            variant="ghost"
            onClick={() => router.push('/feed')}
            className="w-full text-zinc-500 hover:text-zinc-300 hover:bg-white/5 text-xs flex items-center justify-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Ana Sayfaya Dön
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
