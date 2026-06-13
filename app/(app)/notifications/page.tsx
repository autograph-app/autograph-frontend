'use client';

import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bell, Heart, UserPlus, Award, Loader2, Check } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { Button } from '@/components/ui/button';

export default function NotificationsPage() {
  const { notifications, loading, fetchNotifications, markAsRead, markAllAsRead, unreadCount } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getIconConfig = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'like':
      case 'content.liked':
        return { icon: Heart, color: 'text-rose-500 bg-rose-500/10' };
      case 'follow':
      case 'artist.followed':
        return { icon: UserPlus, color: 'text-sky-500 bg-sky-500/10' };
      case 'request':
      case 'signature.requested':
      case 'signature.approved':
        return { icon: Award, color: 'text-amber-500 bg-amber-500/10' };
      default:
        return { icon: Bell, color: 'text-violet-500 bg-violet-500/10' };
    }
  };

  const getInitials = (message: string) => {
    // Basic helper to generate initials from the notification message
    const cleanMsg = message.replace(/[^a-zA-Z ]/g, '');
    const words = cleanMsg.split(' ').filter(w => w.length > 0);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    if (words.length >= 1) {
      return words[0].slice(0, 2).toUpperCase();
    }
    return 'NT';
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Bell className="h-6 w-6 text-violet-400" />
            Notifications
          </h1>
          <p className="text-zinc-400 text-sm">Stay updated with your fan connections and signature deals</p>
        </div>
        {unreadCount > 0 && (
          <Button 
            onClick={markAllAsRead}
            variant="outline" 
            size="sm"
            className="border-white/10 bg-zinc-950/40 text-zinc-300 hover:text-white hover:bg-white/5 cursor-pointer rounded-xl"
          >
            <Check className="h-4 w-4 mr-1.5" />
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500 mb-2" />
          <p className="text-zinc-400 text-sm">Retrieving notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center p-12 border border-dashed border-white/10 rounded-2xl bg-zinc-950/20 max-w-2xl">
          <Bell className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-zinc-400">You do not have any notifications yet.</p>
        </div>
      ) : (
        <div className="max-w-2xl space-y-4">
          {notifications.map((notif) => {
            const { icon: Icon, color: iconColor } = getIconConfig(notif.type);
            return (
              <Card 
                key={notif.id} 
                onClick={() => !notif.isRead && markAsRead(notif.id)}
                className={`border-white/10 transition-all duration-300 backdrop-blur-md cursor-pointer ${
                  notif.isRead 
                    ? 'bg-zinc-950/40 hover:bg-zinc-900/20 opacity-70' 
                    : 'bg-zinc-950/80 border-violet-500/20 hover:bg-zinc-950/90 shadow-md shadow-violet-500/5'
                }`}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${iconColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <Avatar className="h-9 w-9 border border-white/5">
                    <AvatarFallback className="bg-zinc-800 text-white text-xs font-bold">
                      {getInitials(notif.message)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${notif.isRead ? 'text-zinc-400 font-normal' : 'text-white font-semibold'}`}>
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-zinc-500 block mt-1">{formatRelativeTime(notif.createdDate)}</span>
                  </div>
                  {!notif.isRead && (
                    <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse flex-shrink-0" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
