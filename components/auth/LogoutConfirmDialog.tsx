'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LogoutConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LogoutConfirmDialog({ isOpen, onClose }: LogoutConfirmDialogProps) {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        await api.post('/auth/revoke-token', { token: refreshToken });
      }
    } catch (err) {
      console.error('Failed to revoke token on backend:', err);
    } finally {
      logout();
      setLoading(false);
      onClose();
      router.push('/login');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
      <DialogContent className="max-w-sm sm:max-w-md bg-zinc-950/95 border-white/10 text-white shadow-2xl shadow-rose-950/10 backdrop-blur-md rounded-2xl p-6 animate-in fade-in zoom-in duration-200">
        <DialogHeader className="flex flex-col items-center justify-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 ring-8 ring-rose-500/5 animate-pulse">
            <LogOut className="h-5 w-5" />
          </div>
          <DialogTitle className="text-lg font-bold text-white mt-4 text-center">
            Oturumu Kapat
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-sm text-center mt-2 leading-relaxed">
            Hesabınızdan çıkış yapmak istediğinize emin misiniz? Oturumunuz güvenli bir şekilde sonlandırılacaktır.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-row gap-3 mt-6 sm:justify-center w-full">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-5 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all text-xs font-semibold cursor-pointer"
          >
            İptal
          </Button>
          <Button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            className="flex-1 py-5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-500/20 active:scale-95 transition-all text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Çıkış Yapılıyor...
              </>
            ) : (
              <>
                <LogOut className="h-3.5 w-3.5" />
                Çıkış Yap
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
