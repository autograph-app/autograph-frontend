'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Send, Award, CheckCircle2, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';

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
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Suggested creators list with functional follow actions
  const [suggestions, setSuggestions] = useState<SuggestedCreator[]>([
    { id: '11111111-1111-1111-1111-111111111111', name: 'Sasha Gray', username: 'sashagray', initials: 'SG', isFollowing: false },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Marcus Aurelius', username: 'marcus', initials: 'MA', isFollowing: false },
    { id: '33333333-3333-3333-3333-333333333333', name: 'Alice Liddell', username: 'alice', initials: 'AL', isFollowing: false },
  ]);

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
      toast.error('Could not load feed.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      fetchFeed(0);
    });
    return () => cancelAnimationFrame(handle);
  }, [fetchFeed]);

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
      toast.error('Action failed. Please try again.');
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
        toast.success(`Unfollowed @${creator.username}`);
      } else {
        await api.post(`/users/${creatorId}/follow`);
        toast.success(`Following @${creator.username}`);
      }
    } catch (error) {
      console.error('Follow action failed:', error);
      // Revert optimistically
      setSuggestions(prev => prev.map(s => s.id === creatorId ? { ...s, isFollowing: creator.isFollowing } : s));
      toast.error('Follow action failed.');
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
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
            Social Feed
          </h1>
          <p className="text-zinc-400 text-sm">Discover latest releases and signature updates</p>
        </div>
        <Button 
          onClick={handleRefresh}
          variant="outline" 
          size="sm" 
          className="border-white/10 bg-zinc-950/40 text-zinc-300 hover:text-white hover:bg-white/5 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Feed Column */}
        <div className="md:col-span-2 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500 mb-2" />
              <p className="text-zinc-400 text-sm">Loading your timeline...</p>
            </div>
          ) : feed.length === 0 ? (
            <div className="text-center p-12 border border-dashed border-white/10 rounded-2xl bg-zinc-950/20">
              <Sparkles className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-zinc-400">Your feed is empty.</p>
              <p className="text-zinc-500 text-xs mt-1">Follow artists or explore trending items to see updates!</p>
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
                      onClick={() => router.push(`/contents/${item.id}`)}
                      className="aspect-[4/3] w-full bg-zinc-900 relative cursor-pointer group overflow-hidden"
                    >
                      <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                      {item.isSigned && (
                        <div className="absolute top-3 right-3 bg-green-500/20 backdrop-blur-md text-green-400 border border-green-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 fill-green-500/10" /> Cryptographic Sign
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
                        <button className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer" onClick={() => router.push(`/contents/${item.id}`)}>
                          <MessageCircle className="h-5 w-5" />
                          <strong>{item.signatureCount}</strong>
                        </button>
                        <button className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer ml-auto" onClick={() => router.push(`/contents/${item.id}`)}>
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
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading More...
                      </span>
                    ) : (
                      'Load More'
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
                Featured Creators
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
                    {creator.isFollowing ? 'Following' : 'Follow'}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
