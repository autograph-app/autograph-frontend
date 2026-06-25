'use client';

import React, { useState } from 'react';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';

export default function FeedbackModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error('Geri bildirim içeriği boş olamaz.');
      return;
    }
    if (text.length > 300) {
      toast.error('Geri bildirim 300 karakterden fazla olamaz.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/feedback', { feedbackText: text });
      if (response.data?.success) {
        toast.success(response.data?.message || 'Geri bildiriminiz başarıyla iletildi.');
        setText('');
        setIsOpen(false);
      } else {
        toast.error('Geri bildirim iletilemedi.');
      }
    } catch (error: unknown) {
      console.error('Failed to submit feedback:', error);
      let errMsg = 'Geri bildirim gönderilirken bir hata oluştu.';
      if (axios.isAxiosError(error)) {
        errMsg = error.response?.data?.message || errMsg;
      }
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-6 z-50 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-full p-3.5 sm:px-5 sm:py-3.5 shadow-lg shadow-violet-500/20 cursor-pointer transition-all hover:scale-105 active:scale-95 duration-200 border border-white/10"
        title="Geri Bildirim Gönder"
      >
        <MessageSquare className="h-5 w-5" />
        <span className="text-sm font-semibold tracking-wide hidden sm:inline">Geri Bildirim</span>
      </button>

      {/* Dialog Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Geri Bildirim Gönder</DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs mt-1.5">
              Closed Beta test süresince bulduğunuz hataları, deneyimlerinizi veya önerilerinizi en fazla 300 karakter ile bize iletebilirsiniz.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-3">
            <div className="relative">
              <Textarea
                placeholder="Öneri veya hata detaylarını buraya yazın..."
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 300))}
                className="min-h-[120px] bg-white/5 border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20 text-white placeholder-zinc-500 resize-none rounded-xl pr-2 pb-6 text-sm"
                disabled={loading}
              />
              <span className="absolute bottom-2 right-3 text-[10px] font-semibold text-zinc-500">
                {text.length} / 300
              </span>
            </div>

            <DialogFooter className="sm:justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer rounded-xl text-xs py-5 px-4"
                disabled={loading}
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={loading || !text.trim()}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white cursor-pointer rounded-xl font-semibold text-xs py-5 px-5 flex items-center gap-1.5 shadow-md shadow-violet-500/10"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Gönder
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
