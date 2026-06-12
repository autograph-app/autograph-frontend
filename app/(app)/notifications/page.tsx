'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bell, Heart, UserPlus, FileSignature, Sparkles } from 'lucide-react';

export default function NotificationsPage() {
  const notifications = [
    {
      id: 1,
      type: 'like',
      icon: Heart,
      iconColor: 'text-rose-500 bg-rose-500/10',
      message: 'Marcus Aurelius liked your published artwork signature.',
      time: '10 mins ago',
      userInitials: 'MA',
    },
    {
      id: 2,
      type: 'follow',
      icon: UserPlus,
      iconColor: 'text-sky-500 bg-sky-500/10',
      message: 'Alice Liddell started following your updates.',
      time: '1 hour ago',
      userInitials: 'AL',
    },
    {
      id: 3,
      type: 'request',
      icon: FileSignature,
      iconColor: 'text-amber-500 bg-amber-500/10',
      message: 'New custom signature request received from Premium Fan.',
      time: '1 day ago',
      userInitials: 'PF',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <Bell className="h-6 w-6 text-violet-400" />
          Notifications
        </h1>
        <p className="text-zinc-400 text-sm">Stay updated with your fan connections and signature deals</p>
      </div>

      <div className="max-w-2xl space-y-4">
        {notifications.map((notif) => {
          const Icon = notif.icon;
          return (
            <Card key={notif.id} className="border-white/10 bg-zinc-950/60 hover:bg-zinc-900/40 transition-colors backdrop-blur-md">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${notif.iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <Avatar className="h-9 w-9 border border-white/5">
                  <AvatarFallback className="bg-zinc-800 text-white text-xs font-bold">
                    {notif.userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300 font-medium leading-snug">{notif.message}</p>
                  <span className="text-[10px] text-zinc-500 block mt-1">{notif.time}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
