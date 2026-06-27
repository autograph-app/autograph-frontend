'use client';

/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Award, 
  CheckCircle2, 
  Sparkles, 
  Loader2, 
  RefreshCw,
  ShieldCheck,
  Download,
  XCircle,
  Clock,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useI18n } from '@/components/providers/I18nProvider';
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
import { Badge } from '@/components/ui/badge';

interface FeedItem {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  isSigned: boolean;
  signatureCount: number;
  likeCount: number;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  creatorAvatarUrl: string | null;
  creatorIsVerified: boolean;
  createdDate: string;
  isLikedByCurrentUser: boolean;
  watermarkUrl?: string | null;
  signerName?: string | null;
  signerUsername?: string | null;
}

interface SuggestedCreator {
  id: string;
  name: string;
  username: string;
  initials: string;
  isFollowing: boolean;
}

export default function FeedPage() {
  const router = useRouter();
  const { t } = useI18n();
  const currentUser = useAuthStore((state) => state.user);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Suggested creators list with functional follow actions
  const [suggestions, setSuggestions] = useState<SuggestedCreator[]>([]);
  const [activeContentId, setActiveContentId] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    try {
      const response = await api.get('/users/artists');
      if (response.data?.success) {
        const fetched = response.data.data
          .filter((art: { id: string; isFollowing: boolean }) => art.id !== currentUser?.id && !art.isFollowing)
          .map((art: { id: string; displayName?: string; userName: string; isFollowing: boolean }) => ({
            id: art.id,
            name: art.displayName || art.userName,
            username: art.userName,
            initials: (art.displayName || art.userName).slice(0, 2).toUpperCase(),
            isFollowing: art.isFollowing,
          }))
          .sort(() => Math.random() - 0.5)
          .slice(0, 5);
        setSuggestions(fetched);
      }
    } catch (err) {
      console.error('Failed to load artist suggestions:', err);
    }
  }, [currentUser?.id]);

  const fetchFeed = useCallback(async (pageIndex: number, append = false) => {
    if (pageIndex === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const response = await api.get('/feed', {
        params: { pageIndex, pageSize: 5 },
      });

      if (response.data?.success) {
        const newItems = response.data.data;
        if (newItems.length < 5) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        if (append) {
          setFeed((prev) => {
            const existingIds = new Set(prev.map(item => item.id));
            const filteredNew = newItems.filter((item: FeedItem) => !existingIds.has(item.id));
            return [...prev, ...filteredNew];
          });
        } else {
          setFeed(newItems);
        }
      }
    } catch (error) {
      console.error('Failed to load feed:', error);
      toast.error(t('feed.error.load'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [t]);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      fetchFeed(0);
      fetchSuggestions();
    });
    return () => cancelAnimationFrame(handle);
  }, [fetchFeed, fetchSuggestions]);

  const handleRefresh = () => {
    setPage(0);
    setHasMore(true);
    fetchFeed(0, false);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFeed(nextPage, true);
  };

  const toggleLike = async (id: string) => {
    // Optimistic Update
    setFeed((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            isLikedByCurrentUser: !item.isLikedByCurrentUser,
            likeCount: item.isLikedByCurrentUser ? item.likeCount - 1 : item.likeCount + 1,
          };
        }
        return item;
      })
    );

    const targetItem = feed.find((item) => item.id === id);
    if (!targetItem) return;

    try {
      if (targetItem.isLikedByCurrentUser) {
        await api.delete(`/contents/${id}/like`);
      } else {
        await api.post(`/contents/${id}/like`);
      }
    } catch (error) {
      console.error('Like toggle failed:', error);
      // Revert Optimistic Update
      setFeed((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              isLikedByCurrentUser: targetItem.isLikedByCurrentUser,
              likeCount: targetItem.likeCount,
            };
          }
          return item;
        })
      );
      toast.error(t('feed.error.actionFailed'));
    }
  };

  const toggleFollow = async (creatorId: string) => {
    const creator = suggestions.find(s => s.id === creatorId);
    if (!creator) return;

    // Optimistically toggle
    setSuggestions(prev => prev.map(s => s.id === creatorId ? { ...s, isFollowing: !s.isFollowing } : s));

    try {
      if (creator.isFollowing) {
        await api.delete(`/users/${creatorId}/follow`);
        toast.success(t('feed.toast.unfollowed', { username: creator.username }));
      } else {
        await api.post(`/users/${creatorId}/follow`);
        toast.success(t('feed.toast.following', { username: creator.username }));
      }
    } catch (error) {
      console.error('Follow action failed:', error);
      // Revert optimistically
      setSuggestions(prev => prev.map(s => s.id === creatorId ? { ...s, isFollowing: creator.isFollowing } : s));
      toast.error(t('feed.error.followFailed'));
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('feed.time.justNow');
    if (diffMins < 60) return t('feed.time.minutesAgo', { count: String(diffMins) });
    if (diffHours < 24) return t('feed.time.hoursAgo', { count: String(diffHours) });
    return t('feed.time.daysAgo', { count: String(diffDays) });
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-violet-400" />
            {t('feed.title')}
          </h1>
          <p className="text-zinc-400 text-sm">{t('feed.subtitle')}</p>
        </div>
        <Button 
          onClick={handleRefresh}
          variant="outline" 
          size="sm" 
          className="border-white/10 bg-zinc-950/40 text-zinc-300 hover:text-white hover:bg-white/5 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4 mr-1.5" />
          {t('feed.refresh')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Feed Column */}
        <div className="md:col-span-2 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500 mb-2" />
              <p className="text-zinc-400 text-sm">{t('feed.loadingTimeline')}</p>
            </div>
          ) : feed.length === 0 ? (
            <div className="text-center p-12 border border-dashed border-white/10 rounded-2xl bg-zinc-950/20">
              <Sparkles className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-zinc-400">{t('feed.empty.title')}</p>
              <p className="text-zinc-500 text-xs mt-1">{t('feed.empty.description')}</p>
            </div>
          ) : (
            <>
              {feed.map((item) => (
                <Card key={item.id} className="border-white/10 bg-zinc-950/60 backdrop-blur-md overflow-hidden shadow-lg hover:border-white/15 transition-all duration-300">
                  <CardHeader className="p-4 flex flex-row items-center gap-3">
                    <Avatar className="h-10 w-10 border border-white/10 cursor-pointer" onClick={() => router.push(`/profile/${item.creatorId}`)}>
                      <AvatarImage src={item.creatorAvatarUrl || undefined} alt={item.creatorName} />
                      <AvatarFallback className="bg-zinc-800 text-white font-bold">
                        {getInitials(item.creatorName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white truncate cursor-pointer hover:text-violet-400" onClick={() => router.push(`/profile/${item.creatorId}`)}>
                          {item.creatorName}
                        </span>
                        {item.creatorIsVerified && (
                          <CheckCircle2 className="h-4 w-4 text-sky-400 fill-sky-400/20" />
                        )}
                      </div>
                      <span className="text-xs text-zinc-500 block">@{item.creatorUsername} • {formatRelativeTime(item.createdDate)}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div 
                      onClick={() => setActiveContentId(item.id)}
                      className="aspect-[4/3] w-full bg-zinc-900 relative cursor-pointer group overflow-hidden"
                    >
                      <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                      {item.isSigned && (
                        <div className="absolute top-3 right-3 bg-green-500/20 backdrop-blur-md text-green-400 border border-green-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
                          <CheckCircle2 className="h-3.5 w-3.5 fill-green-500/10" /> {t('feed.badge.cryptographicSign')}
                        </div>
                      )}
                      {item.isSigned && item.signerName && (
                        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white border border-white/10 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium shadow-md z-10">
                          <Award className="h-3.5 w-3.5 text-yellow-400" />
                          <span>Signed by <strong className="text-violet-300">{item.signerName}</strong></span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-bold text-base text-white">{item.title}</h3>
                        {item.description && <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{item.description}</p>}
                      </div>
                      
                      {/* Action controls */}
                      <div className="flex items-center gap-4 pt-3 border-t border-white/5">
                        <button 
                          onClick={() => toggleLike(item.id)}
                          className={`flex items-center gap-1.5 text-sm transition-colors cursor-pointer ${
                            item.isLikedByCurrentUser ? 'text-rose-500' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          <Heart className={`h-5 w-5 transition-transform active:scale-125 ${item.isLikedByCurrentUser ? 'fill-rose-500' : ''}`} />
                          <strong>{item.likeCount}</strong>
                        </button>
                        <button className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer" onClick={() => setActiveContentId(item.id)}>
                          <MessageCircle className="h-5 w-5" />
                          <strong>{item.signatureCount}</strong>
                        </button>
                        <button className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer ml-auto" onClick={() => setActiveContentId(item.id)}>
                          <Send className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {hasMore && (
                <div className="text-center pt-2">
                  <Button 
                    onClick={handleLoadMore} 
                    disabled={loadingMore}
                    className="border border-white/10 bg-zinc-950/60 text-white rounded-xl hover:bg-zinc-900/60 font-semibold px-6 py-5 cursor-pointer"
                  >
                    {loadingMore ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="h-4 w-4 animate-spin" /> {t('feed.loadingMore')}
                      </span>
                    ) : (
                      t('feed.loadMore')
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar suggestions Column */}
        <div className="hidden md:block space-y-6">
          <Card className="border-white/10 bg-zinc-950/60 p-4">
            <CardHeader className="p-0 pb-3 mb-3 border-b border-white/5">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-400" />
                {t('feed.featuredCreators')}
              </CardTitle>
            </CardHeader>
            <div className="space-y-3">
              {suggestions.map((creator) => (
                <div key={creator.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-8 w-8 cursor-pointer" onClick={() => router.push(`/profile/${creator.id}`)}>
                      <AvatarFallback className="bg-zinc-800 text-xs font-bold text-white">{creator.initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <span className="font-bold text-xs block text-white truncate hover:text-violet-400 cursor-pointer" onClick={() => router.push(`/profile/${creator.id}`)}>
                        {creator.name}
                      </span>
                      <span className="text-[10px] text-zinc-500 block truncate">@{creator.username}</span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant={creator.isFollowing ? 'secondary' : 'outline'}
                    onClick={() => toggleFollow(creator.id)}
                    className="h-7 text-xs border-white/10 hover:bg-white/5 cursor-pointer px-3 rounded-lg"
                  >
                    {creator.isFollowing ? t('feed.following') : t('feed.follow')}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <ContentDetailModal contentId={activeContentId} onClose={() => setActiveContentId(null)} />
    </div>
  );
}

interface ContentDetailModalProps {
  contentId: string | null;
  onClose: () => void;
}

function ContentDetailModal({ contentId, onClose }: ContentDetailModalProps) {
  const { t } = useI18n();
  const currentUser = useAuthStore((state) => state.user);
  const router = useRouter();
  
  const [content, setContent] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [requestMessage, setRequestMessage] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [signatureRequest, setSignatureRequest] = useState<any | null>(null);
  const [artists, setArtists] = useState<any[]>([]);
  const [selectedArtistId, setSelectedArtistId] = useState<string>('');

  const fetchContentDetail = async () => {
    if (!contentId) return;
    setLoading(true);
    try {
      const response = await api.get(`/contents/${contentId}`);
      if (response.data?.success) {
        const data = response.data.data;
        setContent(data);
        setLikeCount(data.likeCount);
        setIsLiked(data.isLikedByCurrentUser || false);
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
    if (!currentUser || !contentId) return;
    try {
      const response = await api.get('/signature-requests?isInbox=false');
      if (response.data?.success) {
        const list = response.data.data;
        const matching = list.find((r: any) => r.contentId === contentId);
        setSignatureRequest(matching || null);
      }
    } catch (err) {
      console.error('Error fetching signature request status:', err);
    }
  };

  const fetchArtists = async () => {
    try {
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
    if (contentId) {
      fetchContentDetail();
      fetchSignatureRequest();
    } else {
      setContent(null);
    }
  }, [contentId]);

  const isOwnContent = currentUser?.id === content?.creatorId;

  useEffect(() => {
    if (content && isOwnContent && !content.isSigned) {
      fetchArtists();
    }
  }, [content, isOwnContent]);

  const handleLike = async () => {
    if (!content) return;
    try {
      const response = await api.post(`/contents/${content.id}/like`);
      if (response.data?.success) {
        setIsLiked(!isLiked);
        setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
        toast.success(isLiked ? t('content.page.unliked') : t('content.page.liked'));
      }
    } catch (err) {
      toast.error(t('feed.error.actionFailed'));
    }
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
      const response = await api.post('/signature-requests', {
        contentId: content.id,
        artistId: selectedArtistId,
        message: requestMessage.trim() || undefined
      });

      if (response.data?.success) {
        toast.success(t('content.page.requestSent'));
        setIsDialogOpen(false);
        fetchSignatureRequest();
      } else {
        toast.error(t('content.page.error.sendRequest'));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || t('content.page.error.sendSignatureRequest'));
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <Dialog open={!!contentId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl bg-zinc-950 text-white border-white/10 p-6 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center justify-between pr-6">
            <span>{content?.title || t('common.loading')}</span>
            {content?.isSigned && (
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 flex items-center gap-1.5 text-xs font-semibold rounded-full uppercase ml-2">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t('content.page.verifiedAutographed')}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-zinc-500 text-xs">
            {content && t('content.page.uploadedOn', { date: new Date(content.createdDate).toLocaleDateString() })}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex h-[40vh] flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500 mb-2" />
            <p className="text-sm text-zinc-400">{t('content.page.retrieving')}</p>
          </div>
        ) : !content ? (
          <div className="flex h-[40vh] flex-col items-center justify-center text-center">
            <p className="text-zinc-500 text-sm">{t('content.page.missing')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-4">
            {/* Left Image View */}
            <div className="md:col-span-7 space-y-4">
              <div className="relative aspect-[4/3] w-full bg-zinc-900 border border-white/10 rounded-xl overflow-hidden group">
                <img 
                  src={content.isSigned && content.signature ? content.signature.watermarkUrl : content.imageUrl} 
                  alt={content.title} 
                  className="object-contain w-full h-full"
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
              <div className="flex justify-between items-center bg-zinc-900/40 p-3 rounded-lg border border-white/5">
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

            {/* Right Details Info */}
            <div className="md:col-span-5 space-y-4">
              {/* Creator Account Card */}
              <Card className="border-white/10 bg-zinc-900/60">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 border border-white/20">
                      <AvatarImage src={content.creatorAvatarUrl || ''} alt={content.creatorName} />
                      <AvatarFallback className="bg-zinc-800 text-white font-bold text-sm">
                        {content.creatorName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">{t('content.page.createdBy')}</span>
                      <span className="text-white font-bold text-sm block truncate">
                        {content.creatorName}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      onClose();
                      router.push(`/profile/${content.creatorName}`);
                    }}
                    className="border-white/10 text-xs hover:bg-white/5 cursor-pointer shrink-0"
                  >
                    {t('content.page.viewProfile')}
                  </Button>
                </CardContent>
              </Card>

              {/* Description Card */}
              <Card className="border-white/10 bg-zinc-900/60">
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">{t('content.page.about')}</span>
                    <p className="text-zinc-300 text-sm leading-relaxed">
                      {content.description || t('content.page.noDescription')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 pt-3 border-t border-white/5">
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
                  </div>
                </CardContent>
              </Card>

              {/* Request Autograph Box */}
              {!content.isSigned ? (
                signatureRequest && signatureRequest.status === 0 ? (
                  <Card className="border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-zinc-950/40">
                    <CardContent className="p-4 text-center space-y-3">
                      <Clock className="h-8 w-8 text-amber-400 mx-auto animate-pulse" />
                      <div>
                        <h4 className="text-sm font-bold text-white">Signature Request Pending</h4>
                        <p className="text-zinc-400 text-[11px] mt-0.5">
                          Your request to <strong className="text-white">{signatureRequest.artistName}</strong> is awaiting review.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : signatureRequest && signatureRequest.status === 2 ? (
                  <Card className="border-rose-500/20 bg-gradient-to-br from-rose-950/20 to-zinc-950/40">
                    <CardContent className="p-4 text-center space-y-3">
                      <XCircle className="h-8 w-8 text-rose-400 mx-auto" />
                      <div>
                        <h4 className="text-sm font-bold text-white">Signature Request Rejected</h4>
                        <p className="text-zinc-400 text-[11px] mt-0.5">
                          Your request was rejected by <strong className="text-white">{signatureRequest.artistName}</strong>.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : isOwnContent ? (
                  <Card className="border-violet-500/20 bg-gradient-to-br from-violet-950/20 to-fuchsia-950/15">
                    <CardContent className="p-4 text-center space-y-3">
                      <Award className="h-8 w-8 text-violet-400 mx-auto" />
                      <div>
                        <h4 className="text-sm font-bold text-white">Request Digital Autograph</h4>
                        <p className="text-zinc-400 text-[10px] mt-0.5">
                          Ask a verified artist to digitally sign this artwork.
                        </p>
                      </div>

                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-semibold rounded-lg shadow-lg cursor-pointer h-9">
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
                ) : null
              ) : (
                /* Verified Signature Details Card */
                <Card className="border-emerald-500/25 bg-gradient-to-br from-emerald-950/20 to-zinc-950/40">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-emerald-400" />
                      <h4 className="text-sm font-bold text-white">Verified Cryptographic Signature</h4>
                    </div>

                    <div className="space-y-2 text-xs border-t border-white/5 pt-2">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Signer:</span>
                        <span className="text-zinc-300 font-bold">{content.signature?.artistName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Signed On:</span>
                        <span className="text-zinc-300">{new Date(content.signature?.signedAt || '').toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col gap-1 mt-1 border-t border-white/5 pt-2">
                        <span className="text-zinc-500">SHA-256 Proof Hash:</span>
                        <div className="flex items-center justify-between bg-black/40 p-1.5 rounded border border-white/5 min-w-0">
                          <code className="text-[10px] text-violet-300 font-mono truncate mr-2 flex-1">{content.signature?.hash}</code>
                          <button onClick={handleCopyHash} className="text-zinc-400 hover:text-white shrink-0">
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
