'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Compass, ShieldAlert, Sparkles, Flame, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function ExplorePage() {
  const router = useRouter();
  const [searchId, setSearchId] = useState('');

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
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Trending Collections</h3>
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
    </div>
  );
}
