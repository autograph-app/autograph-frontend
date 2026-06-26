'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Compass, Sparkles, Flame, Star, Loader2, Heart, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface FeedItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
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

interface UserSearchResult {
  id: string;
  userName: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
}

type CategoryKey = 'digital' | 'sports' | 'music';

interface ActiveExperience {
  mode: 'category' | 'trending';
  title: string;
  items: FeedItem[];
  startItemId?: string;
}

export default function ExplorePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [trendingItems, setTrendingItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeExperience, setActiveExperience] = useState<ActiveExperience | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    try {
      const response = await api.get('/users/search', {
        params: { query: searchQuery.trim() }
      });
      if (response.data?.success) {
        setSearchResults(response.data.data);
        if (response.data.data.length === 0) {
          toast.info('No profiles found matching your query.');
        }
      }
    } catch (err) {
      console.error('Search failed:', err);
      toast.error('Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
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

  useEffect(() => {
    if (!activeExperience) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeExperience]);

  useEffect(() => {
    if (!activeExperience?.startItemId) return;

    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(`explore-slide-${activeExperience.startItemId}`);
      target?.scrollIntoView({ block: 'start' });
    });

    return () => cancelAnimationFrame(frame);
  }, [activeExperience]);

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

  const resolveCategoryForItem = useCallback((item: FeedItem): CategoryKey => {
    if (item.category === 'sports') return 'sports';
    if (item.category === 'music') return 'music';
    return 'digital';
  }, []);

  const categorizedItems = useMemo(() => {
    return trendingItems.reduce<Record<CategoryKey, FeedItem[]>>(
      (acc, item) => {
        const category = resolveCategoryForItem(item);
        acc[category].push(item);
        return acc;
      },
      { digital: [], sports: [], music: [] }
    );
  }, [trendingItems, resolveCategoryForItem]);

  const openCategoryExperience = (category: CategoryKey, title: string) => {
    const items = categorizedItems[category];
    if (items.length === 0) {
      toast.info('This category has no content yet.');
      return;
    }

    setActiveExperience({
      mode: 'category',
      title,
      items,
    });
  };

  const openTrendingExperience = (startItemId?: string) => {
    if (trendingItems.length === 0) {
      toast.info('Trending feed is empty.');
      return;
    }

    setActiveExperience({
      mode: 'trending',
      title: 'Trending Artworks',
      items: trendingItems,
      startItemId,
    });
  };

  const closeExperience = () => {
    setActiveExperience(null);
  };

  const trendingCategories = [
    {
      key: 'digital' as CategoryKey,
      title: 'Digital Arts',
      icon: Sparkles,
      color: 'text-violet-400 bg-violet-500/10',
      count: `${categorizedItems.digital.length} items`
    },
    {
      key: 'sports' as CategoryKey,
      title: 'Sports Memorabilia',
      icon: Flame,
      color: 'text-fuchsia-400 bg-fuchsia-500/10',
      count: `${categorizedItems.sports.length} items`
    },
    {
      key: 'music' as CategoryKey,
      title: 'Music Collectibles',
      icon: Star,
      color: 'text-amber-400 bg-amber-500/10',
      count: `${categorizedItems.music.length} items`
    },
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
            Search Profiles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
            <Input
              type="text"
              placeholder="Search by name or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 h-11 border-white/10 bg-black/40 text-white placeholder:text-zinc-600 focus-visible:border-violet-500 focus-visible:ring-violet-500/30"
            />
            <Button type="submit" disabled={searchLoading} className="h-11 px-6 bg-violet-600 hover:bg-violet-500 cursor-pointer">
              {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </form>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="border-t border-white/5 pt-4 space-y-3 max-w-xl">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Search Results</h4>
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div 
                    key={user.id} 
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-white border border-white/10 overflow-hidden">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.userName} className="w-full h-full object-cover" />
                        ) : (
                          (user.displayName || user.userName).slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-sm text-white truncate">
                            {user.displayName || user.userName}
                          </span>
                          {user.isVerified && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-sky-400 fill-sky-400/20" />
                          )}
                        </div>
                        <span className="text-xs text-zinc-500 block">@{user.userName}</span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => router.push(`/profile/${user.id}`)}
                      className="h-8 bg-zinc-800 hover:bg-zinc-700 text-white text-xs border border-white/10 rounded-lg cursor-pointer"
                    >
                      View Profile
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trending categories section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Trending Categories</h3>
        <p className="text-xs text-zinc-500">Tap any category to enter vertical swipe mode and scroll through only that category.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {trendingCategories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <Card
                key={i}
                onClick={() => openCategoryExperience(cat.key, cat.title)}
                className="border-white/5 bg-zinc-900/30 hover:bg-zinc-900/50 transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
              >
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
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <Flame className="h-4 w-4 text-fuchsia-400" />
            Trending Artworks
          </h3>
          <Button
            onClick={() => openTrendingExperience()}
            className="h-8 px-3 text-xs border border-white/10 bg-zinc-900/70 hover:bg-zinc-800 cursor-pointer"
          >
            Vertical Browse
          </Button>
        </div>
        <p className="text-xs text-zinc-500">Smaller thumbnails for denser discovery. Tap any item to open full-screen vertical flow.</p>
        
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {trendingItems.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => openTrendingExperience(item.id)}
                  className="group relative rounded-xl overflow-hidden border border-white/10 bg-zinc-950 shadow-lg transition-all duration-300 hover:scale-[1.01] hover:border-violet-500/30 cursor-pointer"
                >
                  <div className="aspect-[4/5] w-full bg-zinc-900 relative overflow-hidden">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent opacity-90 group-hover:opacity-95 transition-opacity duration-300" />
                    
                    {item.isSigned && (
                      <div className="absolute top-2 right-2 bg-green-500/20 backdrop-blur-md text-green-400 border border-green-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 fill-green-500/10" /> Signed
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col justify-end">
                      <h4 className="font-bold text-xs text-white group-hover:text-violet-300 transition-colors truncate">{item.title}</h4>
                      <p className="text-[10px] text-zinc-400 truncate mt-0.5">@{item.creatorUsername}</p>
                    </div>
                  </div>
                  <div className="px-3 py-2 flex items-center justify-between border-t border-white/5 bg-zinc-950/90 text-[11px]">
                    <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">
                      {item.signatureCount} sig
                    </span>
                    <button 
                      onClick={(e) => toggleLike(item.id, e)}
                      className={`flex items-center gap-1.5 font-bold hover:text-rose-500 transition-colors ${
                        item.isLikedByCurrentUser ? 'text-rose-500' : 'text-zinc-400'
                      }`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${item.isLikedByCurrentUser ? 'fill-rose-500' : ''}`} />
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

      {activeExperience && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md">
          <div className="mx-auto flex h-full max-w-3xl flex-col p-3 sm:p-5">
            <div className="mb-3 flex items-center justify-between rounded-xl border border-white/10 bg-zinc-950/80 p-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                  {activeExperience.mode === 'category' ? 'Category Flow' : 'Trending Flow'}
                </p>
                <h4 className="text-sm font-bold text-white">{activeExperience.title}</h4>
              </div>
              <Button
                onClick={closeExperience}
                className="h-9 w-9 p-0 border border-white/10 bg-zinc-900/70 hover:bg-zinc-800 cursor-pointer"
                aria-label="Close vertical browser"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-[calc(100vh-110px)] overflow-y-auto snap-y snap-mandatory space-y-4 pr-1">
              {activeExperience.items.map((item) => (
                <article
                  id={`explore-slide-${item.id}`}
                  key={item.id}
                  className="snap-start min-h-[calc(100vh-150px)] rounded-2xl border border-white/10 bg-zinc-950 overflow-hidden"
                >
                  <div className="relative h-[70vh] min-h-[320px] bg-zinc-900">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    {item.isSigned && (
                      <div className="absolute right-4 top-4 bg-green-500/20 backdrop-blur-md text-green-400 border border-green-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 fill-green-500/10" /> Signed
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                      <h3 className="text-xl sm:text-2xl font-extrabold text-white">{item.title}</h3>
                      <p className="mt-1 text-sm text-zinc-300">by @{item.creatorUsername}</p>
                      {item.description && (
                        <p className="mt-3 line-clamp-3 text-sm text-zinc-300/90">{item.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 p-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span>{item.signatureCount} signatures</span>
                      <span className="text-zinc-700">|</span>
                      <span>{item.likeCount} likes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={(e) => toggleLike(item.id, e)}
                        className={`h-9 px-3 text-xs border cursor-pointer ${
                          item.isLikedByCurrentUser
                            ? 'border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                            : 'border-white/10 bg-zinc-900 text-zinc-200 hover:bg-zinc-800'
                        }`}
                      >
                        <Heart className={`h-3.5 w-3.5 ${item.isLikedByCurrentUser ? 'fill-rose-500' : ''}`} />
                        Like
                      </Button>
                      <Button
                        onClick={() => router.push(`/contents/${item.id}`)}
                        className="h-9 px-3 text-xs border border-violet-500/40 bg-violet-500/20 text-violet-100 hover:bg-violet-500/30 cursor-pointer"
                      >
                        Open Detail
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
