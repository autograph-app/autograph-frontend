'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Send, Award, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FeedPage() {
  const [likes, setLikes] = useState<Record<string, { count: number; active: boolean }>>({
    'post-1': { count: 324, active: false },
    'post-2': { count: 1205, active: true },
  });

  const toggleLike = (id: string) => {
    setLikes((prev) => {
      const item = prev[id];
      if (item.active) {
        return { ...prev, [id]: { count: item.count - 1, active: false } };
      } else {
        return { ...prev, [id]: { count: item.count + 1, active: true } };
      }
    });
  };

  const feedItems = [
    {
      id: 'post-1',
      artistName: 'Sasha Gray',
      username: 'sashagray',
      isVerified: true,
      avatar: '',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
      description: 'First digital signature release for Autograph v2.0! Limited edition custom canvas prints are now available for request. ✨',
      time: '2 hours ago',
    },
    {
      id: 'post-2',
      artistName: 'Marcus Aurelius',
      username: 'marcus',
      isVerified: true,
      avatar: '',
      image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=800&auto=format&fit=crop',
      description: 'Abstract digital sculpture signature ready. Hand-signed using cryptographic proof on the blockchain. 🎨🏛️',
      time: '1 day ago',
    },
  ];

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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Feed Column */}
        <div className="md:col-span-2 space-y-6">
          {feedItems.map((item) => {
            const likeState = likes[item.id] || { count: 0, active: false };
            return (
              <Card key={item.id} className="border-white/10 bg-zinc-950/60 backdrop-blur-md overflow-hidden">
                <CardHeader className="p-4 flex flex-row items-center gap-3">
                  <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarFallback className="bg-zinc-800 text-white font-bold">
                      {item.artistName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white truncate">{item.artistName}</span>
                      {item.isVerified && (
                        <CheckCircle2 className="h-4 w-4 text-sky-400 fill-sky-400/20" />
                      )}
                    </div>
                    <span className="text-xs text-zinc-500 block">@{item.username} • {item.time}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="aspect-[4/3] w-full bg-zinc-900 relative">
                    <img 
                      src={item.image} 
                      alt="Feed asset" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="p-4 space-y-4">
                    <p className="text-sm text-zinc-300 leading-relaxed">{item.description}</p>
                    
                    {/* Action controls */}
                    <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                      <button 
                        onClick={() => toggleLike(item.id)}
                        className={`flex items-center gap-1.5 text-sm transition-colors cursor-pointer ${
                          likeState.active ? 'text-rose-500' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Heart className={`h-5 w-5 ${likeState.active ? 'fill-rose-500' : ''}`} />
                        <strong>{likeState.count}</strong>
                      </button>
                      <button className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer">
                        <MessageCircle className="h-5 w-5" />
                        <strong>18</strong>
                      </button>
                      <button className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer ml-auto">
                        <Send className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-zinc-800 text-xs font-bold text-white">JD</AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="font-bold text-xs block text-white">John Doe</span>
                    <span className="text-[10px] text-zinc-500">@johndoe</span>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs border-white/10 hover:bg-white/5 cursor-pointer">
                  Follow
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-zinc-800 text-xs font-bold text-white">AL</AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="font-bold text-xs block text-white">Alice Liddell</span>
                    <span className="text-[10px] text-zinc-500">@alice</span>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs border-white/10 hover:bg-white/5 cursor-pointer">
                  Follow
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
