'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { HubConnectionBuilder, HttpTransportType } from '@microsoft/signalr';
import { toast } from 'sonner';
import { 
  Sparkles, 
  Home, 
  Compass, 
  Bell, 
  PlusSquare, 
  User as UserIcon, 
  LogOut, 
  Loader2,
  Menu,
  X,
  ChevronRight,
  Inbox
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, user, logout } = useAuthStore();
  const { unreadCount, fetchNotifications, addNotification } = useNotificationStore();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  // Fetch initial notifications
  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token, fetchNotifications]);

  // SignalR Hub Connection Setup
  useEffect(() => {
    if (!token) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5036';
    const connection = new HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/notifications`, {
        accessTokenFactory: () => useAuthStore.getState().token || '',
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .build();

    connection.on('ReceiveNotification', (notification: { id?: string; type: string; title: string; message: string; timestamp?: string }) => {
      toast(notification.title || 'Notification', {
        description: notification.message,
      });

      addNotification({
        id: notification.id || Math.random().toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: false,
        createdDate: notification.timestamp || new Date().toISOString(),
      });
    });

    connection.start().catch((err) => console.error('SignalR Connection Error: ', err));

    return () => {
      connection.stop();
    };
  }, [token, addNotification]);

  useEffect(() => {
    if (mounted && !token) {
      router.push('/login');
    }
  }, [mounted, token, router]);

  if (!mounted || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  const navItems = [
    { name: 'Feed', href: '/feed', icon: Home },
    { name: 'Explore', href: '/explore', icon: Compass },
    ...(user && user.accountType === 1 ? [{ name: 'Artist Inbox', href: '/inbox', icon: Inbox }] : []),
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Share Content', href: '/content', icon: PlusSquare },
    { name: 'My Profile', href: user ? `/profile/${user.userName}` : '/profile/me', icon: UserIcon },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col md:flex-row">
      {/* Background radial ambient lights */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-violet-600/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-fuchsia-600/5 blur-[120px]" />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-zinc-950/80 border-r border-white/10 p-6 z-20 backdrop-blur-md sticky top-0 h-screen">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 shadow-md shadow-violet-500/20 ring-1 ring-white/10">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              AUTOGRAPH
            </h1>
            <p className="text-[10px] text-zinc-500 font-semibold tracking-widest uppercase">
              Exclusive
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.name === 'My Profile' && pathname.startsWith('/profile'));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative group overflow-hidden ${
                  isActive 
                    ? 'text-white bg-gradient-to-r from-violet-600/20 to-fuchsia-600/10 border-l-2 border-violet-500 shadow-md shadow-violet-500/5' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-violet-400' : ''}`} />
                {item.name}
                {item.name === 'Notifications' && unreadCount > 0 && (
                  <span className="ml-auto bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
                {isActive && item.name !== 'Notifications' && (
                  <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        {user && (
          <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-10 w-10 border border-white/20">
                <AvatarImage src={user.avatarUrl} alt={user.displayName || user.userName} />
                <AvatarFallback className="bg-zinc-800 text-white font-bold">
                  {getInitials(user.displayName || user.userName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate text-white leading-none">
                  {user.displayName || user.userName}
                </p>
                <p className="text-xs text-zinc-400 truncate mt-1">
                  {user.accountType === 1 ? 'Artist' : 'Fan'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="text-zinc-500 hover:text-rose-400 transition-colors p-1.5 hover:bg-white/5 rounded-lg"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between bg-zinc-950/90 border-b border-white/10 px-5 py-4 sticky top-0 z-30 backdrop-blur-md w-full">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-600">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-extrabold text-sm tracking-wider text-white">AUTOGRAPH</span>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <Avatar className="h-8 w-8 border border-white/10">
              <AvatarImage src={user.avatarUrl} alt={user.displayName || user.userName} />
              <AvatarFallback className="bg-zinc-800 text-white text-xs font-bold">
                {getInitials(user.displayName || user.userName)}
              </AvatarFallback>
            </Avatar>
          )}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-zinc-400 hover:text-white p-1 hover:bg-white/5 rounded-md"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[65px] bg-black/95 z-30 flex flex-col p-6 backdrop-blur-lg border-t border-white/5 animate-in fade-in slide-in-from-top-4 duration-300">
          <nav className="space-y-2 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.name === 'My Profile' && pathname.startsWith('/profile'));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-base font-semibold ${
                    isActive 
                      ? 'text-white bg-white/10' 
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    {item.name}
                    {item.name === 'Notifications' && unreadCount > 0 && (
                      <span className="bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-white/10 pt-6 mt-auto">
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full h-11 flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 bg-black min-h-[calc(100vh-65px)] md:min-h-screen p-4 sm:p-6 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto h-full flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
