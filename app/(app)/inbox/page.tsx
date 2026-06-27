'use client';

/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, react/no-unescaped-entities */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Inbox, 
  Clock, 
  Check, 
  X, 
  MessageSquare, 
  FileText, 
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Image as ImageIcon
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useI18n } from '@/components/providers/I18nProvider';

interface SignatureRequestDto {
  id: string;
  contentId: string;
  contentTitle: string;
  contentImageUrl: string;
  fanId: string;
  fanName: string;
  artistId: string;
  artistName: string;
  message: string | null;
  status: number; // 0 = Pending, 1 = Approved, 2 = Rejected
  createdDate: string;
}

export default function ArtistInboxPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<SignatureRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ title: string; url: string } | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { api } = await import('@/lib/api');
      const response = await api.get('/signature-requests?isInbox=true');
      if (response.data?.success) {
        setRequests(response.data.data);
      } else {
        toast.error(t('inbox.error.loadRequests'));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || t('inbox.error.fetchRequests'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.accountType !== 1) {
      toast.error(t('inbox.error.artistOnly'));
      router.push('/feed');
      return;
    }
    fetchRequests();
  }, [user, t]);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const { api } = await import('@/lib/api');
      const response = await api.post(`/signature-requests/${id}/approve`);
      if (response.data?.success) {
        toast.success(t('inbox.success.approved'));
        fetchRequests();
      } else {
        toast.error(response.data?.message || t('inbox.error.approvalFailed'));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || t('inbox.error.approvingSignature'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      const { api } = await import('@/lib/api');
      const response = await api.post(`/signature-requests/${id}/reject`);
      if (response.data?.success) {
        toast.success(t('inbox.success.rejected'));
        fetchRequests();
      } else {
        toast.error(response.data?.message || t('inbox.error.rejectionFailed'));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || t('inbox.error.rejectingRequest'));
    } finally {
      setProcessingId(null);
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500 mb-4" />
        <p className="text-sm">{t('inbox.loading')}</p>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 0);
  const resolvedRequests = requests.filter(r => r.status !== 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <Inbox className="h-6 w-6 text-violet-400" />
          {t('inbox.title')}
        </h1>
        <p className="text-zinc-400 text-sm">{t('inbox.subtitle')}</p>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="bg-zinc-950 border border-white/5 p-1 rounded-xl">
          <TabsTrigger value="pending" className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer">
            {t('inbox.tab.pending', { count: String(pendingRequests.length) })}
          </TabsTrigger>
          <TabsTrigger value="history" className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer">
            {t('inbox.tab.history', { count: String(resolvedRequests.length) })}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-12 bg-zinc-950/40 rounded-3xl border border-white/5 space-y-4">
              <CheckCircle className="h-10 w-10 text-zinc-600" />
              <div>
                <h3 className="font-bold text-white text-sm">{t('inbox.pending.empty.title')}</h3>
                <p className="text-zinc-500 text-xs mt-1">{t('inbox.pending.empty.description')}</p>
              </div>
            </div>
          ) : (
            pendingRequests.map((req) => (
              <Card key={req.id} className="border-white/10 bg-zinc-950/60 backdrop-blur-md overflow-hidden relative">
                <CardContent className="p-5 flex flex-col md:flex-row gap-5 items-start justify-between">
                  <div className="flex gap-4 items-start flex-1 min-w-0">
                    <Avatar className="h-10 w-10 border border-white/10 shrink-0">
                      <AvatarFallback className="bg-zinc-800 text-white font-bold">
                        {req.fanName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2 min-w-0">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white truncate">{req.fanName}</span>
                          <Badge className="bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[10px]">{t('inbox.status.fan')}</Badge>
                        </div>
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" /> {t('inbox.requestedOn', { date: new Date(req.createdDate).toLocaleDateString() })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 p-2 bg-black/40 rounded-lg border border-white/5 max-w-md">
                        {req.contentImageUrl ? (
                          <button
                            type="button"
                            onClick={() => setPreviewImage({ title: req.contentTitle, url: req.contentImageUrl })}
                            className="h-11 w-11 rounded-md overflow-hidden border border-white/10 shrink-0 cursor-pointer"
                            aria-label={t('inbox.previewArtwork')}
                          >
                            <img src={req.contentImageUrl} alt={req.contentTitle} className="h-full w-full object-cover" />
                          </button>
                        ) : (
                          <div className="h-11 w-11 rounded-md border border-white/10 bg-zinc-900/80 flex items-center justify-center shrink-0">
                            <ImageIcon className="h-4 w-4 text-zinc-500" />
                          </div>
                        )}
                        <FileText className="h-4 w-4 text-zinc-500 shrink-0" />
                        <span className="text-xs text-zinc-400 truncate">
                          {t('inbox.artworkLabel')} <strong className="text-white hover:underline cursor-pointer" onClick={() => router.push(`/contents/${req.contentId}`)}>{req.contentTitle}</strong>
                        </span>
                        <ExternalLink className="h-3 w-3 text-zinc-500 shrink-0 cursor-pointer" onClick={() => router.push(`/contents/${req.contentId}`)} />
                      </div>

                      {req.message && (
                        <div className="p-3 bg-zinc-900/40 rounded-xl border border-white/5 flex gap-2 items-start max-w-lg">
                          <MessageSquare className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-zinc-300 italic leading-relaxed">&ldquo;{req.message}&rdquo;</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-2 w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-white/5">
                    <Button 
                      disabled={processingId !== null}
                      onClick={() => handleApprove(req.id)}
                      className="flex-1 md:w-32 h-10 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {processingId === req.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4" /> {t('inbox.sign')}
                        </>
                      )}
                    </Button>
                    <Button 
                      disabled={processingId !== null}
                      onClick={() => handleReject(req.id)}
                      variant="outline"
                      className="flex-1 md:w-32 h-10 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <X className="h-4 w-4" /> {t('inbox.reject')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {resolvedRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-12 bg-zinc-950/40 rounded-3xl border border-white/5 space-y-4">
              <Inbox className="h-10 w-10 text-zinc-600" />
              <div>
                <h3 className="font-bold text-white text-sm">{t('inbox.history.empty.title')}</h3>
                <p className="text-zinc-500 text-xs mt-1">{t('inbox.history.empty.description')}</p>
              </div>
            </div>
          ) : (
            resolvedRequests.map((req) => (
              <Card key={req.id} className="border-white/5 bg-zinc-900/20 backdrop-blur-md opacity-80">
                <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex gap-3 items-center">
                    <Avatar className="h-8 w-8 border border-white/5">
                      <AvatarFallback className="bg-zinc-800 text-white font-bold text-xs">
                        {req.fanName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white">{req.fanName}</span>
                        <span className="text-[10px] text-zinc-500">• {req.contentTitle}</span>
                      </div>
                      <span className="text-[9px] text-zinc-500 block">Requested on {new Date(req.createdDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {req.status === 1 ? (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold rounded-full uppercase flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> {t('inbox.status.signed')}
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold rounded-full uppercase flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> {t('inbox.status.rejected')}
                      </Badge>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => router.push(`/contents/${req.contentId}`)}
                      className="h-7 text-xs text-zinc-400 hover:text-white cursor-pointer"
                    >
                      {t('inbox.viewArtwork')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={previewImage !== null} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-3xl p-0 bg-zinc-950 border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 bg-zinc-900/70">
            <DialogTitle className="text-sm font-bold text-white truncate">
              {previewImage?.title || t('inbox.preview.title')}
            </DialogTitle>
          </div>
          <div className="bg-black/70 max-h-[75vh] overflow-auto">
            {previewImage && (
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="w-full h-auto object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
