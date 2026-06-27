'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  CheckCircle2, 
  Award, 
  Users, 
  User as UserIcon, 
  Edit3, 
  UploadCloud, 
  Grid, 
  Heart, 
  Calendar, 
  Loader2, 
  UserCheck, 
  UserPlus,
  Settings,
  Sparkles,
  Info,
  EyeOff,
  LogOut,
  Clock,
  XCircle
} from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LogoutConfirmDialog from '@/components/auth/LogoutConfirmDialog';
import { useI18n } from '@/components/providers/I18nProvider';

interface ContentItem {
  id: string;
  imageUrl: string;
  description: string;
  likesCount: number;
  isLikedByCurrentUser: boolean;
  createdDate: string;
  isSigned: boolean;
}

interface ProfileData {
  id: string;
  userName: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  accountType: number; // 0 = Fan, 1 = Artist, 2 = Admin
  isVerified: boolean;
  isPremium: boolean;
  followersCount: number;
  followingCount: number;
  signatureRequestCount: number;
  isFollowing: boolean;
  contents: ContentItem[];
}

interface SignatureRequestDto {
  id: string;
  contentId: string;
  contentTitle: string;
  contentImageUrl: string;
  fanId: string;
  fanName: string;
  artistId: string;
  artistName: string;
  message: string | null;
  status: number; // 0 = Pending, 1 = Approved, 2 = Rejected
  createdDate: string;
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const { user: currentUser, updateUser } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Outgoing signature requests state for fan review section
  const [signatureRequests, setSignatureRequests] = useState<SignatureRequestDto[]>([]);

  const handleLogout = () => {
    setIsLogoutDialogOpen(true);
  };

  // Edit form state
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAccountType, setEditAccountType] = useState<number>(0);
  const [savingProfile, setSavingProfile] = useState(false);

  // Check if viewing own profile
  const isOwnProfile = 
    !params?.username || 
    params.username === 'me' || 
    params.username === currentUser?.userName ||
    (profile !== null && profile.id === currentUser?.id);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      let endpoint = '/users/profile';
      
      // If we are looking for a specific user and it is NOT our own profile,
      // and it looks like a GUID, fetch it.
      if (!isOwnProfile && params?.username) {
        const usernameStr = params.username as string;
        // Verify if it is a Guid
        const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (guidRegex.test(usernameStr)) {
          endpoint = `/users/profile/${usernameStr}`;
        } else {
          // If username is not a Guid, we fall back to my own profile 
          // (Autograph Phase 1 only exposes profile lookup by Guid).
          endpoint = '/users/profile';
        }
      }

      const response = await api.get(endpoint);
      if (response.data?.success) {
        const p = response.data.data;
        setProfile(p);
        // Sync to store if it's our own profile
        if (isOwnProfile && p) {
          updateUser({
            displayName: p.displayName || undefined,
            avatarUrl: p.avatarUrl || undefined,
            bio: p.bio || undefined,
            accountType: p.accountType,
            isVerified: p.isVerified,
            isPremium: p.isPremium,
          });

          // Fetch outgoing signature requests for own Fan profile
          if (p.accountType !== 1) {
            try {
              const sigRes = await api.get('/signature-requests?isInbox=false');
              if (sigRes.data?.success) {
                setSignatureRequests(sigRes.data.data);
              }
            } catch (err) {
              console.error('Failed to fetch signature requests:', err);
            }
          }
        }
      } else {
        toast.error('Failed to load profile.');
      }
    } catch (error: unknown) {
      console.error(error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Error fetching profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      fetchProfile();
    });
    return () => cancelAnimationFrame(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.username]);

  // Open modal and prepopulate
  const handleOpenEdit = () => {
    if (!profile) return;
    setEditDisplayName(profile.displayName || '');
    setEditBio(profile.bio || '');
    setEditAccountType(profile.accountType);
    setIsEditOpen(true);
  };

  // Submit profile edits
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      // 1. Update display name & bio
      const updateRes = await api.put('/users/profile', {
        displayName: editDisplayName,
        bio: editBio,
      });

      // 2. If account type changed, trigger that endpoint
      if (editAccountType !== profile?.accountType) {
        await api.post('/users/profile/account-type', {
          accountType: editAccountType,
        });
      }

      if (updateRes.data?.success) {
        toast.success('Profile updated successfully!');
        setIsEditOpen(false);
        fetchProfile();
      }
    } catch (error: unknown) {
      console.error(error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Upload Avatar
  const handleAvatarClick = () => {
    if (isOwnProfile && !uploadingAvatar) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are supported.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploadingAvatar(true);
    toast.loading('Uploading avatar...');

    try {
      const response = await api.post('/users/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.dismiss();
      if (response.data?.success) {
        toast.success(t('profile.toast.avatarUploaded'));
        setProfile(response.data.data);
        if (response.data.data) {
          updateUser({ avatarUrl: response.data.data.avatarUrl || undefined });
        }
      } else {
        toast.error(t('profile.toast.avatarUploadFailed'));
      }
    } catch (error: unknown) {
      toast.dismiss();
      console.error(error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('profile.toast.avatarUploadFailed'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const toggleFollow = async () => {
    if (!profile || followingLoading) return;
    setFollowingLoading(true);

    const wasFollowing = profile.isFollowing;
    const originalFollowersCount = profile.followersCount;

    // Optimistically toggle
    setProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        isFollowing: !wasFollowing,
        followersCount: wasFollowing 
          ? Math.max(0, originalFollowersCount - 1) 
          : originalFollowersCount + 1
      };
    });

    try {
      if (wasFollowing) {
        await api.delete(`/users/${profile.id}/follow`);
        toast.success(t('feed.toast.unfollowed', { username: profile.userName }));
      } else {
        await api.post(`/users/${profile.id}/follow`);
        toast.success(t('feed.toast.following', { username: profile.userName }));
      }
    } catch (error: unknown) {
      console.error('Follow action failed:', error);
      // Revert optimistically
      setProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          isFollowing: wasFollowing,
          followersCount: originalFollowersCount
        };
      });
      toast.error(t('profile.toast.followFailed'));
    } finally {
      setFollowingLoading(false);
    }
  };

  const handleHideSignedContent = async (e: React.MouseEvent, contentId: string) => {
    e.stopPropagation();
    if (!confirm(t('profile.request.hideConfirm'))) {
      return;
    }

    try {
      const response = await api.post(`/signature-requests/contents/${contentId}/hide`);
      if (response.data?.success) {
        toast.success(t('profile.request.hidden'));
        fetchProfile();
      } else {
        toast.error(t('profile.toast.contentHideFailed'));
      }
    } catch (error: unknown) {
      console.error('Hide signed content failed:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('profile.toast.contentHideFailed'));
    }
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
        <Info className="h-10 w-10 text-zinc-500 mb-2" />
        <p className="text-zinc-400">{t('profile.notFound')}</p>
        <Button onClick={() => router.push('/feed')} className="mt-4 bg-zinc-800 hover:bg-zinc-700">
          {t('profile.goToFeed')}
        </Button>
      </div>
    );
  }

  // Sort contents for Top Collection (by likesCount descending)
  const topCollectionContents = profile?.contents 
    ? [...profile.contents].sort((a, b) => b.likesCount - a.likesCount)
    : [];

  // Sort contents for All Content (by isSigned descending, and then by createdDate descending)
  const allContents = profile?.contents 
    ? [...profile.contents].sort((a, b) => {
        if (a.isSigned && !b.isSigned) return -1;
        if (!a.isSigned && b.isSigned) return 1;
        return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
      })
    : [];

  // Outgoing signature requests filtered for review
  const reviewContents = signatureRequests.filter(r => r.status === 0 || r.status === 2);

  // Signed top contents for fan profile (sorted by likesCount descending)
  const signedTopContents = profile?.contents
    ? [...profile.contents].filter(c => c.isSigned).sort((a, b) => b.likesCount - a.likesCount)
    : [];

  const renderContentGrid = (items: ContentItem[]) => {
    if (!items || items.length === 0) {
      return (
        <div className="text-center p-12 border border-dashed border-white/10 rounded-2xl bg-zinc-950/20">
          <Sparkles className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-zinc-500 text-sm">{t('profile.emptyGrid')}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <div 
            key={item.id} 
            onClick={() => router.push(`/contents/${item.id}`)}
            className="group relative rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-violet-500/30 cursor-pointer"
          >
            <div className="aspect-video w-full bg-zinc-900 relative">
              <img 
                src={item.imageUrl} 
                alt={item.description} 
                className="object-cover w-full h-full"
              />
              {item.isSigned && (
                <div className="absolute top-2 right-2 bg-green-500/20 backdrop-blur-md text-green-400 border border-green-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 z-10">
                  <CheckCircle2 className="h-3 w-3 fill-green-500/10" /> {t('feed.badge.cryptographicSign')}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                <p className="text-xs text-white truncate max-w-[70%] font-medium">
                  {item.description}
                </p>
                {isOwnProfile && profile.accountType === 1 && item.isSigned && (
                  <button
                    onClick={(e) => handleHideSignedContent(e, item.id)}
                    className="bg-red-500/80 hover:bg-red-600 backdrop-blur-md text-white border border-red-500/30 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all duration-200 shadow-md hover:scale-105 z-20"
                    title={t('profile.hideContent.title')}
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                    {t('profile.hideContent')}
                  </button>
                )}
              </div>
            </div>
            <div className="p-4 flex items-center justify-between border-t border-white/5">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                {t('profile.publishedPost')}
              </span>
              <button className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-rose-500 transition-colors">
                <Heart className={`h-4 w-4 ${item.isLikedByCurrentUser ? 'fill-rose-500 text-rose-500' : ''}`} />
                <strong>{item.likesCount}</strong>
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Profile Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-r from-violet-900/40 via-fuchsia-900/30 to-zinc-950 p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center md:items-end justify-between shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 pointer-events-none" />
        
        {/* User Info / Avatar */}
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 z-10 text-center md:text-left w-full md:w-auto">
          {/* Avatar Area with hover action if owner */}
          <div 
            onClick={handleAvatarClick}
            className={`relative group rounded-3xl overflow-hidden cursor-pointer shadow-2xl border-4 border-zinc-950/80 transition-all duration-300 ${
              isOwnProfile ? 'hover:scale-105' : ''
            }`}
          >
            <Avatar className="h-28 w-28 md:h-32 md:w-32 rounded-3xl">
              <AvatarImage src={profile.avatarUrl || undefined} alt={profile.displayName || profile.userName} />
              <AvatarFallback className="bg-zinc-800 text-white text-3xl font-extrabold rounded-3xl">
                {getInitials(profile.displayName || profile.userName)}
              </AvatarFallback>
            </Avatar>

            {isOwnProfile && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-300 gap-1 text-xs font-semibold text-white">
                <UploadCloud className="h-5 w-5" />
                {t('profile.avatar.changePhoto')}
              </div>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*" 
            />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                {profile.displayName || profile.userName}
              </h1>
              {profile.isVerified && (
                <span title={t('profile.verifiedArtist')}>
                  <CheckCircle2 className="h-5 w-5 text-sky-400 fill-sky-400/20" />
                </span>
              )}
              {profile.isPremium && (
                <span title={t('profile.premiumSubscriber')}>
                  <Award className="h-5 w-5 text-amber-400" />
                </span>
              )}
              {profile.accountType === 1 && (
                <span className="text-[10px] font-bold tracking-widest uppercase bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full">
                  {t('profile.role.artistTag')}
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-400 font-medium">@{profile.userName}</p>
            
            {/* Stats */}
            <div className="flex items-center justify-center md:justify-start gap-6 text-sm text-zinc-300 mt-2 font-medium">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-zinc-400" />
                <strong>{profile.followersCount}</strong> {t('profile.stats.followers')}
              </span>
              {profile.accountType !== 1 && (
                <>
                  <span>
                    <strong>{profile.followingCount}</strong> {t('profile.stats.following')}
                  </span>
                  <span className="flex items-center gap-1.5" title={t('profile.stats.collectorScore')}>
                    <Award className="h-4 w-4 text-amber-400" />
                    <strong>{profile.signatureRequestCount}</strong> {t('profile.stats.collectorScore')}
                  </span>
                </>
              )}
              {profile.accountType === 1 && (
                <span className="flex items-center gap-1.5" title={t('profile.stats.signaturePower')}>
                  <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
                  <strong>{profile.signatureRequestCount}</strong> {t('profile.stats.signaturePower')}
                </span>
              )}
            </div>

            {/* Short Bio Description (Fan Profile) */}
            {profile.accountType !== 1 && (
              <p className="text-sm text-zinc-300 mt-3 max-w-xl leading-relaxed whitespace-pre-line text-center md:text-left">
                {profile.bio || (isOwnProfile ? t('profile.bio.placeholderOwn') : "")}
              </p>
            )}
          </div>
        </div>

        {/* Profile Action Buttons */}
        <div className="z-10 flex items-center gap-3">
          {isOwnProfile ? (
            <>
              <Button 
                onClick={handleOpenEdit} 
                className="bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl px-5 py-5 flex items-center gap-2 font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-violet-600/10 cursor-pointer"
              >
                <Edit3 className="h-4 w-4" />
                {t('profile.edit')}
              </Button>
              <Button 
                onClick={handleLogout} 
                variant="destructive"
                className="rounded-xl px-5 py-5 flex items-center gap-2 font-semibold transition-all duration-300 cursor-pointer shadow-lg shadow-rose-600/10 active:scale-95"
                id="profile-logout-btn"
              >
                <LogOut className="h-4 w-4" />
                {t('profile.logout')}
              </Button>
            </>
          ) : (
            <Button 
              onClick={toggleFollow}
              disabled={followingLoading}
              className={`rounded-xl px-6 py-5 font-semibold transition-all duration-300 cursor-pointer ${
                profile.isFollowing 
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10' 
                  : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/20'
              }`}
            >
              {profile.isFollowing ? (
                <span className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" /> {t('profile.following')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" /> {t('profile.follow')}
                </span>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Profile Details Section */}
      {profile.accountType !== 1 ? (
        /* Fan Profile Layout */
        <div className={isOwnProfile ? "grid grid-cols-1 lg:grid-cols-2 gap-8" : "w-full"}>
          {/* Left Column: Signed Top Contents */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-violet-400" />
                {t('profile.signedTopContent')}
              </h3>
            </div>

            {signedTopContents.length === 0 ? (
              <div className="text-center p-12 border border-dashed border-white/10 rounded-2xl bg-zinc-950/20">
                <Award className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-zinc-500 text-sm">{t('profile.noSignedContent')}</p>
              </div>
            ) : (
              renderContentGrid(signedTopContents)
            )}
          </div>

          {/* Right Column: Pending and Rejected Signature Requests (Own Profile only) */}
          {isOwnProfile && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-400" />
                  {t('profile.requests.review.title')}
                </h3>
              </div>

              {reviewContents.length === 0 ? (
                <div className="text-center p-12 border border-dashed border-white/10 rounded-2xl bg-zinc-950/20">
                  <Clock className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-zinc-500 text-sm">{t('profile.requests.review.empty')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviewContents.map((req) => (
                    <div
                      key={req.id}
                      onClick={() => router.push(`/contents/${req.contentId}`)}
                      className="group flex items-start gap-4 p-4 rounded-2xl border border-white/10 bg-zinc-950/50 hover:bg-zinc-950 hover:border-violet-500/30 transition-all duration-300 cursor-pointer"
                    >
                      <div className="h-16 w-24 rounded-lg overflow-hidden bg-zinc-900 flex-shrink-0 border border-white/5 relative">
                        <img
                          src={req.contentImageUrl}
                          alt={req.contentTitle}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-white truncate group-hover:text-violet-400 transition-colors">
                            {req.contentTitle}
                          </h4>
                          {req.status === 0 ? (
                            <span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Clock className="h-3 w-3" /> {t('profile.request.status.inReview')}
                            </span>
                          ) : (
                            <span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <XCircle className="h-3 w-3" /> {t('profile.request.status.rejected')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400">
                          {t('profile.request.artist')}: <strong className="text-zinc-300">@{req.artistName}</strong>
                        </p>
                        {req.message && (
                          <p className="text-xs text-zinc-500 italic truncate mt-1">
                            &quot;{req.message}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Artist Profile Layout */
        <div className="w-full">
          <Tabs defaultValue="gallery" className="w-full">
            <TabsList className="bg-zinc-950/80 border border-white/10 rounded-xl p-1 mb-6">
              <TabsTrigger value="gallery" className="rounded-lg data-[state=active]:bg-zinc-900 text-sm font-semibold">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  {t('profile.topCollection')}
                </span>
              </TabsTrigger>
              <TabsTrigger value="all-contents" className="rounded-lg data-[state=active]:bg-zinc-900 text-sm font-semibold">
                <span className="flex items-center gap-2">
                  <Grid className="h-4 w-4" />
                  {t('profile.allContent')}
                </span>
              </TabsTrigger>
              <TabsTrigger value="about" className="rounded-lg data-[state=active]:bg-zinc-900 text-sm font-semibold">
                {t('profile.about')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="gallery" className="outline-none space-y-4">
              {renderContentGrid(topCollectionContents)}
            </TabsContent>

            <TabsContent value="all-contents" className="outline-none space-y-4">
              {renderContentGrid(allContents)}
            </TabsContent>

            <TabsContent value="about" className="outline-none">
              <Card className="border-white/10 bg-zinc-950/60 p-6 space-y-6">
                <div className="space-y-3">
                  <h4 className="font-bold text-lg text-white flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-violet-400" />
                    {t('profile.biography')}
                  </h4>
                  <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-line">
                    {profile.bio || t('profile.bio.placeholderOwn')}
                  </p>
                </div>

                <div className="border-t border-white/10 pt-4 flex items-center justify-between text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> {t('profile.memberSince')}
                  </span>
                  <span>June 2026</span>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-white font-bold mb-2">{t('profile.artistInformation')}</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {t('profile.artistInfo.description')}
                  </p>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Edit Profile Modal (Shadcn Dialog) */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="border-white/10 bg-zinc-900 text-white max-w-md backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Settings className="h-5 w-5 text-violet-400" />
              {t('profile.editModal.title')}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              {t('profile.editModal.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Display Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                {t('profile.editModal.displayName')}
              </label>
              <Input
                type="text"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder={t('profile.editModal.displayNamePlaceholder')}
                className="h-11 border-white/10 bg-black/40 text-white placeholder:text-zinc-600 focus-visible:border-violet-500 focus-visible:ring-violet-500/30"
              />
            </div>

            {/* Bio Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                {t('profile.editModal.bio')}
              </label>
              <Textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder={t('profile.editModal.bioPlaceholder')}
                className="min-h-[100px] border-white/10 bg-black/40 text-white placeholder:text-zinc-600 focus-visible:border-violet-500 focus-visible:ring-violet-500/30"
              />
            </div>

            {/* Account Type Option Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                {t('profile.editModal.accountType')}
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setEditAccountType(0)}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all duration-300 cursor-pointer ${
                    editAccountType === 0
                      ? 'border-violet-500 bg-violet-500/10 text-white'
                      : 'border-white/10 bg-black/40 text-zinc-400 hover:border-white/20'
                  }`}
                >
                  <UserIcon className="h-5 w-5 mb-1 text-violet-400" />
                  <span className="text-xs font-bold">{t('profile.editModal.fanAccount')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditAccountType(1)}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all duration-300 cursor-pointer ${
                    editAccountType === 1
                      ? 'border-fuchsia-500 bg-fuchsia-500/10 text-white'
                      : 'border-white/10 bg-black/40 text-zinc-400 hover:border-white/20'
                  }`}
                >
                  <Award className="h-5 w-5 mb-1 text-fuchsia-400" />
                  <span className="text-xs font-bold">{t('profile.editModal.artistAccount')}</span>
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsEditOpen(false)}
              className="text-zinc-400 hover:text-white cursor-pointer"
            >
              {t('profile.editModal.cancel')}
            </Button>
            <Button
              type="button"
              disabled={savingProfile}
              onClick={handleSaveProfile}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-lg px-6 shadow-md hover:shadow-violet-600/20 cursor-pointer"
            >
              {savingProfile ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('profile.editModal.saving')}
                </span>
              ) : (
                t('profile.editModal.save')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <LogoutConfirmDialog isOpen={isLogoutDialogOpen} onClose={() => setIsLogoutDialogOpen(false)} />
    </div>
  );
}
