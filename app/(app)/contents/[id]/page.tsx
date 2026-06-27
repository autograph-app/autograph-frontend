'use client';

/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Award, 
  Heart, 
  Share2, 
  ShieldCheck, 
  Download, 
  Loader2,
  Copy,
  Clock,
  XCircle,
  Info
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/components/providers/I18nProvider';

interface SignatureDto {
  id: string;
  requestId: string;
  fanId: string;
  fanName: string;
  artistId: string;
  artistName: string;
  signedAt: string;
  hash: string;
  watermarkUrl: string;
  certificateUrl?: string;
}

interface ContentDetailDto {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  isSigned: boolean;
  signatureCount: number;
  likeCount: number;
  creatorId: string;
  creatorName: string;
  creatorAvatarUrl: string | null;
  createdDate: string;
  signature: SignatureDto | null;
}

export default function ContentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const { user: currentUser } = useAuthStore();
  
  const [content, setContent] = useState<ContentDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [requestMessage, setRequestMessage] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [signatureRequest, setSignatureRequest] = useState<any | null>(null);
  const [artists, setArtists] = useState<any[]>([]);
  const [selectedArtistId, setSelectedArtistId] = useState<string>('');

  const fetchContentDetail = async () => {
    if (!params?.id) return;
    setLoading(true);
    try {
      const { api } = await import('@/lib/api');
      const response = await api.get(`/contents/${params.id}`);
      if (response.data?.success) {
        const data = response.data.data;
        setContent(data);
        setLikeCount(data.likeCount);
      } else {
        toast.error(t('content.page.error.loadDetails'));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || t('content.page.error.fetchDetails'));
    } finally {
      setLoading(false);
    }
  };

  const fetchSignatureRequest = async () => {
    if (!currentUser || !params?.id) return;
    try {
      const { api } = await import('@/lib/api');
      const response = await api.get('/signature-requests?isInbox=false');
      if (response.data?.success) {
        const list = response.data.data;
        const matching = list.find((r: any) => r.contentId === params.id);
        setSignatureRequest(matching || null);
      }
    } catch (err) {
      console.error('Error fetching signature request status:', err);
    }
  };

  const fetchArtists = async () => {
    try {
      const { api } = await import('@/lib/api');
      const response = await api.get('/users/artists');
      if (response.data?.success) {
        setArtists(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedArtistId(response.data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching artists:', err);
    }
  };

  useEffect(() => {
    fetchContentDetail();
  }, [params?.id]);

  useEffect(() => {
    if (params?.id && currentUser) {
      fetchSignatureRequest();
    }
  }, [params?.id, currentUser]);

  const isOwnContent = currentUser?.id === content?.creatorId;

  useEffect(() => {
    if (content && isOwnContent && !content.isSigned) {
      fetchArtists();
    }
  }, [content, isOwnContent]);

  const handleLike = async () => {
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    toast.success(isLiked ? t('content.page.unliked') : t('content.page.liked'));
  };

  const handleCopyHash = () => {
    if (content?.signature?.hash) {
      navigator.clipboard.writeText(content.signature.hash);
      toast.success(t('content.page.hashCopied'));
    }
  };

  const handleSendSignatureRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content || !selectedArtistId) {
      toast.error(t('content.page.selectArtistRequired'));
      return;
    }

    setIsRequesting(true);
    try {
      const { api } = await import('@/lib/api');
      const response = await api.post('/signature-requests', {
        contentId: content.id,
        artistId: selectedArtistId,
        message: requestMessage.trim() || undefined
      });

      if (response.data?.success) {
        toast.success(t('content.page.requestSent'));
        setIsDialogOpen(false);
        setRequestMessage('');
        fetchSignatureRequest();
      } else {
        toast.error(response.data?.message || t('content.page.error.sendRequest'));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || t('content.page.error.sendSignatureRequest'));
    } finally {
      setIsRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500 mb-4" />
        <p className="text-sm">{t('content.page.retrieving')}</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center p-6 bg-zinc-950/40 rounded-3xl border border-white/5">
        <p className="text-zinc-500 text-sm mb-4">{t('content.page.missing')}</p>
        <Button onClick={() => router.push('/feed')} className="bg-zinc-800 hover:bg-zinc-700 cursor-pointer">
          {t('content.page.backToFeed')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            {content.title}
          </h1>
          <p className="text-zinc-500 text-sm">{t('content.page.uploadedOn', { date: new Date(content.createdDate).toLocaleDateString() })}</p>
        </div>
        <div className="flex items-center gap-2">
          {content.isSigned && (
            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 flex items-center gap-1.5 text-xs font-semibold rounded-full uppercase">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t('content.page.verifiedAutographed')}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image Display */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[4/3] w-full bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl group">
            <Image 
              src={content.isSigned && content.signature ? content.signature.watermarkUrl : content.imageUrl} 
              alt={content.title} 
              className="object-contain w-full h-full"
              fill
            />
            {content.isSigned && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                <span className="text-xs text-white/80 font-mono">Autographed Digital Replica</span>
                <a 
                  href={content.signature?.watermarkUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-lg text-white backdrop-blur-md transition-colors"
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center bg-zinc-950/40 p-3 rounded-xl border border-white/5">
            <span className="text-xs text-zinc-500">
              {content.isSigned ? t('content.page.viewingWatermarked') : t('content.page.viewingOriginal')}
            </span>
            {content.isSigned && content.signature && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs border-white/10 hover:bg-white/5 cursor-pointer"
                onClick={() => window.open(content.signature?.watermarkUrl, '_blank')}
              >
                <Download className="h-3.5 w-3.5 mr-1" /> {t('content.page.downloadCopy')}
              </Button>
            )}
          </div>
        </div>

        {/* Right Column: Information & Interactions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Creator Profile */}
          <Card className="border-white/10 bg-zinc-950/60 backdrop-blur-md">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-white/20">
                  <AvatarImage src={content.creatorAvatarUrl || ''} alt={content.creatorName} />
                  <AvatarFallback className="bg-zinc-800 text-white font-bold">
                    {content.creatorName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">{t('content.page.createdBy')}</span>
                  <span className="text-white font-bold text-sm hover:underline cursor-pointer">
                    {content.creatorName}
                  </span>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push(`/profile/${content.creatorName}`)}
                className="border-white/10 text-xs hover:bg-white/5 cursor-pointer"
              >
                {t('content.page.viewProfile')}
              </Button>
            </CardContent>
          </Card>

          {/* Description & Likes */}
          <Card className="border-white/10 bg-zinc-950/60 backdrop-blur-md">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1">
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">{t('content.page.about')}</span>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  {content.description || t('content.page.noDescription')}
                </p>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                <Button 
                  onClick={handleLike}
                  variant="ghost" 
                  className={`h-9 px-3 gap-1.5 hover:bg-white/5 rounded-lg cursor-pointer ${
                    isLiked ? 'text-rose-500' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isLiked ? 'fill-rose-500' : ''}`} />
                  <strong>{t('content.page.likes', { count: String(likeCount) })}</strong>
                </Button>
                <Button variant="ghost" className="h-9 px-3 gap-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer">
                  <Share2 className="h-5 w-5" />
                  {t('content.page.share')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Signature Action Section */}
          {!content.isSigned ? (
            signatureRequest && signatureRequest.status === 0 ? (
              <Card className="border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-zinc-950/40 backdrop-blur-md">
                <CardContent className="p-6 text-center space-y-4">
                  <Clock className="h-10 w-10 text-amber-400 mx-auto animate-pulse" />
                  <div>
                    <h3 className="text-base font-bold text-white">Signature Request Pending</h3>
                    <p className="text-zinc-400 text-xs mt-1">
                      Your request to <strong className="text-white">{signatureRequest.artistName}</strong> is awaiting review.
                    </p>
                    {signatureRequest.message && (
                      <p className="text-zinc-500 text-xs mt-2 italic border-t border-white/5 pt-2 max-w-sm mx-auto">
                        &ldquo;{signatureRequest.message}&rdquo;
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : signatureRequest && signatureRequest.status === 2 ? (
              <Card className="border-rose-500/20 bg-gradient-to-br from-rose-950/20 to-zinc-950/40 backdrop-blur-md">
                <CardContent className="p-6 text-center space-y-4">
                  <XCircle className="h-10 w-10 text-rose-400 mx-auto" />
                  <div>
                    <h3 className="text-base font-bold text-white">Signature Request Rejected</h3>
                    <p className="text-zinc-400 text-xs mt-1">
                      Your request was rejected by <strong className="text-white">{signatureRequest.artistName}</strong>.
                    </p>
                  </div>
                  {isOwnContent && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg cursor-pointer">
                          Request Autograph Again
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="border-white/10 bg-zinc-950 text-white">
                        <DialogHeader>
                          <DialogTitle>Send Signature Request</DialogTitle>
                          <DialogDescription className="text-zinc-400">
                            Choose a verified artist and add an optional message with your autograph request.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSendSignatureRequest} className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                              Select Artist
                            </label>
                            {artists.length === 0 ? (
                              <p className="text-xs text-zinc-500">Loading available artists...</p>
                            ) : (
                              <select
                                value={selectedArtistId}
                                onChange={(e) => setSelectedArtistId(e.target.value)}
                                className="w-full h-11 px-3 rounded-lg border border-white/10 bg-black text-white focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm cursor-pointer"
                              >
                                {artists.map((artist) => (
                                  <option key={artist.id} value={artist.id} className="bg-zinc-950 text-white">
                                    {artist.displayName || artist.userName} (@{artist.userName})
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                              Personal Message (Optional)
                            </label>
                            <Textarea
                              placeholder="Hi! I'd be absolutely thrilled if you signed my artwork!"
                              value={requestMessage}
                              onChange={(e) => setRequestMessage(e.target.value)}
                              className="border-white/10 bg-black/40 text-white placeholder:text-zinc-600 focus-visible:border-violet-500"
                              maxLength={500}
                            />
                          </div>
                          <DialogFooter>
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setIsDialogOpen(false)}
                              className="border-white/10 text-white hover:bg-white/5"
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={isRequesting || !selectedArtistId}
                              className="bg-violet-600 hover:bg-violet-500"
                            >
                              {isRequesting ? 'Sending...' : 'Send Request'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>
            ) : isOwnContent ? (
              <Card className="border-violet-500/20 bg-gradient-to-br from-violet-950/20 to-fuchsia-950/15 backdrop-blur-md">
                <CardContent className="p-6 text-center space-y-4">
                  <Award className="h-10 w-10 text-violet-400 mx-auto animate-pulse" />
                  <div>
                    <h3 className="text-base font-bold text-white">Request Digital Autograph</h3>
                    <p className="text-zinc-400 text-xs mt-1 max-w-sm mx-auto">
                      Ask a verified creator to digitally sign this artwork. Standard users are limited to 3 request tokens daily.
                    </p>
                  </div>

                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-violet-600/20 cursor-pointer">
                        Request Autograph
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border-white/10 bg-zinc-950 text-white">
                      <DialogHeader>
                        <DialogTitle>Send Signature Request</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                          Choose a verified artist and add an optional message with your autograph request.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSendSignatureRequest} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                            Select Artist
                          </label>
                          {artists.length === 0 ? (
                            <p className="text-xs text-zinc-500">Loading available artists...</p>
                          ) : (
                            <select
                              value={selectedArtistId}
                              onChange={(e) => setSelectedArtistId(e.target.value)}
                              className="w-full h-11 px-3 rounded-lg border border-white/10 bg-black text-white focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm cursor-pointer"
                            >
                              {artists.map((artist) => (
                                <option key={artist.id} value={artist.id} className="bg-zinc-950 text-white">
                                  {artist.displayName || artist.userName} (@{artist.userName})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                            Personal Message (Optional)
                          </label>
                          <Textarea
                            placeholder="Hi! I'd be absolutely thrilled if you signed my artwork!"
                            value={requestMessage}
                            onChange={(e) => setRequestMessage(e.target.value)}
                            className="border-white/10 bg-black/40 text-white placeholder:text-zinc-600 focus-visible:border-violet-500"
                            maxLength={500}
                          />
                        </div>
                        <DialogFooter>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsDialogOpen(false)}
                            className="border-white/10 text-white hover:bg-white/5"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={isRequesting || !selectedArtistId}
                            className="bg-violet-600 hover:bg-violet-500"
                          >
                            {isRequesting ? 'Sending...' : 'Send Request'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-white/5 bg-zinc-950/20 backdrop-blur-md">
                <CardContent className="p-6 text-center space-y-2">
                  <Info className="h-5 w-5 text-zinc-600 mx-auto animate-pulse" />
                  <p className="text-xs text-zinc-500">
                    Only the creator of this artwork (<strong className="text-zinc-400">{content.creatorName}</strong>) can request digital signatures.
                  </p>
                </CardContent>
              </Card>
            )
          ) : (
            /* Autograph Certificate Stamp Card */
            <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-teal-950/15 backdrop-blur-md">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Autograph Certificate</h3>
                    <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Cryptographically Authenticated</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs border-t border-white/5 pt-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Signer:</span>
                    <span className="text-white font-bold font-mono">{content.signature?.artistName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Signed At:</span>
                    <span className="text-white font-semibold">
                      {content.signature?.signedAt && new Date(content.signature.signedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Recipient (Fan):</span>
                    <span className="text-white font-semibold">{content.signature?.fanName}</span>
                  </div>
                  <div className="flex flex-col gap-1 mt-2 p-2 bg-black/40 rounded-lg border border-white/5">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">SHA-256 Digest Code:</span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-emerald-400 font-mono break-all leading-tight select-all">
                        {content.signature?.hash}
                      </span>
                      <button 
                        onClick={handleCopyHash}
                        className="text-zinc-400 hover:text-white p-1 hover:bg-white/5 rounded"
                        title="Copy Hash"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {content.signature?.certificateUrl && (
                  <Button 
                    onClick={() => window.open(content.signature?.certificateUrl, '_blank')}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-lg shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <Download className="h-4 w-4" /> Download PDF Certificate
                  </Button>
                )}

                <div className="text-[10px] text-zinc-500 italic bg-white/5 p-2 rounded-lg leading-relaxed">
                  This asset carries a visual watermark in the bottom-right corner stamped with SkiaSharp at compile time. The hash validates the original upload binary.
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
