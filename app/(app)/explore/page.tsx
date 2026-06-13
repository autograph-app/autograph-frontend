'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Compass, ShieldAlert, Sparkles, Flame, Star, Loader2, Heart, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

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
}

export default function ExplorePage() {
  const router = useRouter();
  const [searchId, setSearchId] = useState('');
  const [trendingItems, setTrendingItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId) return;

    // Validate Guid format
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!guidRegex.test(searchId.trim())) {
      toast.error('Please enter a valid User Guid (UUID) format.');
      return;
    }

    router.push(`/profile/${searchId.trim()}`);
  };

  const fetchExplore = useCallback(async (pageIndex: number, append = false) => {
    if (pageIndex === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const response = await api.get('/explore', {
        params: { pageIndex, pageSize: 6 },
      });

      if (response.data?.success) {
        const items = response.data.data;
        if (items.length < 6) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        if (append) {
          setTrendingItems((prev) => {
            const existingIds = new Set(prev.map(i => i.id));
            const filteredNew = items.filter((i: FeedItem) => !existingIds.has(i.id));
            return [...prev, ...filteredNew];
          });
        } else {
          setTrendingItems(items);
        }
      }
    } catch (error) {
      console.error('Failed to fetch explore feed:', error);
      toast.error('Could not load trending content.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      fetchExplore(0);
    });
    return () => cancelAnimationFrame(handle);
  }, [fetchExplore]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchExplore(nextPage, true);
  };

  const toggleLike = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid navigating to details page

    // Optimistically toggle
    setTrendingItems((prev) =>
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

    const targetItem = trendingItems.find((item) => item.id === id);
    if (!targetItem) return;

    try {
      if (targetItem.isLikedByCurrentUser) {
        await api.delete(`/contents/${id}/like`);
      } else {
        await api.post(`/contents/${id}/like`);
      }
    } catch (error) {
      console.error('Like toggle failed:', error);
      // Revert optimistic toggle
      setTrendingItems((prev) =>
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
      toast.error('Action failed.');
    }
  };

  const trendingCategories = [
    { title: 'Digital Arts', count: '1.2k signatures', icon: Sparkles, color: 'text-violet-400 bg-violet-500/10' },
    { title: 'Sports Memorabilia', count: '852 signatures', icon: Flame, color: 'text-fuchsia-400 bg-fuchsia-500/10' },
    { title: 'Music Collectibles', count: '412 signatures', icon: Star, color: 'text-amber-400 bg-amber-500/10' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <Compass className="h-6 w-6 text-violet-400" />
          Explore Autograph
        </h1>
        <p className="text-zinc-400 text-sm">Find verified creators and search profiles by User GUID</p>
      </div>

      {/* Lookup Card */}
      <Card className="border-white/10 bg-zinc-950/60 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <Search className="h-4 w-4 text-violet-400" />
            Lookup Profile by GUID
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
            <Input
              type="text"
              placeholder="e.g. d2f214e4-b3ff-4a4b-8524-7b19bf35a4d1"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="flex-1 h-11 border-white/10 bg-black/40 text-white placeholder:text-zinc-600 focus-visible:border-violet-500 focus-visible:ring-violet-500/30"
            />
            <Button type="submit" className="h-11 px-6 bg-violet-600 hover:bg-violet-500 cursor-pointer">
              Lookup
            </Button>
          </form>
          <p className="text-[11px] text-zinc-500 mt-2 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" /> Note: Currently, public search is conducted directly via User Identifier UUIDs.
          </p>
        </CardContent>
      </Card>

      {/* Trending categories section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Trending Categories</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {trendingCategories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <Card key={i} className="border-white/5 bg-zinc-900/30 hover:bg-zinc-900/50 transition-all duration-300">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${cat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{cat.title}</h4>
                    <p className="text-xs text-zinc-500 mt-1">{cat.count}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Trending Feed Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <Flame className="h-4 w-4 text-fuchsia-400" />
          Trending Artworks
        </h3>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500 mb-2" />
            <p className="text-zinc-400 text-sm">Loading trending works...</p>
          </div>
        ) : trendingItems.length === 0 ? (
          <div className="text-center p-12 border border-dashed border-white/10 rounded-2xl bg-zinc-950/20">
            <Sparkles className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-400 text-sm">No trending artworks discovered yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingItems.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => router.push(`/contents/${item.id}`)}
                  className="group relative rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-violet-500/30 cursor-pointer"
                >
                  <div className="aspect-video w-full bg-zinc-900 relative overflow-hidden">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-300" />
                    
                    {item.isSigned && (
                      <div className="absolute top-3 right-3 bg-green-500/20 backdrop-blur-md text-green-400 border border-green-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 fill-green-500/10" /> Signed
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col justify-end">
                      <h4 className="font-bold text-sm text-white group-hover:text-violet-300 transition-colors truncate">{item.title}</h4>
                      <p className="text-[11px] text-zinc-400 truncate mt-1">by @{item.creatorUsername}</p>
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between border-t border-white/5 bg-zinc-950/90 text-xs">
                    <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                      {item.signatureCount} Signatures
                    </span>
                    <button 
                      onClick={(e) => toggleLike(item.id, e)}
                      className={`flex items-center gap-1.5 font-bold hover:text-rose-500 transition-colors ${
                        item.isLikedByCurrentUser ? 'text-rose-500' : 'text-zinc-400'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${item.isLikedByCurrentUser ? 'fill-rose-500' : ''}`} />
                      <span>{item.likeCount}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="text-center pt-2">
                <Button 
                  onClick={handleLoadMore} 
                  disabled={loadingMore}
                  className="border border-white/10 bg-zinc-950/60 text-white rounded-xl hover:bg-zinc-900/60 font-semibold px-6 py-5 cursor-pointer"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                    </span>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
