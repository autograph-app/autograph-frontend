'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  Info
} from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
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

interface ContentItem {
  id: string;
  imageUrl: string;
  description: string;
  likesCount: number;
  isLikedByCurrentUser: boolean;
  createdDate: string;
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
  isFollowing: boolean;
  contents: ContentItem[];
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, updateUser } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit form state
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAccountType, setEditAccountType] = useState<number>(0);
  const [savingProfile, setSavingProfile] = useState(false);

  // Check if viewing own profile
  const isOwnProfile = 
    !params?.username || 
    params.username === 'me' || 
    params.username === currentUser?.userName;

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
        setProfile(response.data.data);
        // Sync to store if it's our own profile
        if (isOwnProfile && response.data.data) {
          const p = response.data.data;
          updateUser({
            displayName: p.displayName || undefined,
            avatarUrl: p.avatarUrl || undefined,
            bio: p.bio || undefined,
            accountType: p.accountType,
            isVerified: p.isVerified,
            isPremium: p.isPremium,
          });
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
        toast.success('Avatar uploaded successfully!');
        setProfile(response.data.data);
        if (response.data.data) {
          updateUser({ avatarUrl: response.data.data.avatarUrl || undefined });
        }
      } else {
        toast.error('Failed to upload avatar.');
      }
    } catch (error: unknown) {
      toast.dismiss();
      console.error(error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to upload avatar.');
    } finally {
      setUploadingAvatar(false);
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
        <p className="text-zinc-400">Profile not found</p>
        <Button onClick={() => router.push('/feed')} className="mt-4 bg-zinc-800 hover:bg-zinc-700">
          Go to Feed
        </Button>
      </div>
    );
  }

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
                Change Photo
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
                <span title="Verified Artist">
                  <CheckCircle2 className="h-5 w-5 text-sky-400 fill-sky-400/20" />
                </span>
              )}
              {profile.isPremium && (
                <span title="Premium Subscriber">
                  <Award className="h-5 w-5 text-amber-400" />
                </span>
              )}
              {profile.accountType === 1 && (
                <span className="text-[10px] font-bold tracking-widest uppercase bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full">
                  Artist
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-400 font-medium">@{profile.userName}</p>
            
            {/* Stats */}
            <div className="flex items-center justify-center md:justify-start gap-6 text-sm text-zinc-300 mt-2 font-medium">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-zinc-400" />
                <strong>{profile.followersCount}</strong> followers
              </span>
              <span>
                <strong>{profile.followingCount}</strong> following
              </span>
            </div>
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
                Edit Profile
              </Button>
            </>
          ) : (
            <Button 
              className={`rounded-xl px-6 py-5 font-semibold transition-all duration-300 cursor-pointer ${
                profile.isFollowing 
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10' 
                  : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/20'
              }`}
            >
              {profile.isFollowing ? (
                <span className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" /> Following
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" /> Follow
                </span>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Profile Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Bio & Details card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-white/10 bg-zinc-950/60 backdrop-blur-md">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-violet-400" />
                Biography
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-line">
                {profile.bio || "No biography provided yet. Set a bio in edit profile."}
              </p>
              
              <div className="border-t border-white/10 pt-4 flex items-center justify-between text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Member Since
                </span>
                <span>June 2026</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Tabbed Contents */}
        <div className="lg:col-span-2">
          {profile.accountType === 1 ? (
            /* Artist content tab display */
            <Tabs defaultValue="gallery" className="w-full">
              <TabsList className="bg-zinc-950/80 border border-white/10 rounded-xl p-1 mb-6">
                <TabsTrigger value="gallery" className="rounded-lg data-[state=active]:bg-zinc-900 text-sm font-semibold">
                  <span className="flex items-center gap-2">
                    <Grid className="h-4 w-4" />
                    Top Collection
                  </span>
                </TabsTrigger>
                <TabsTrigger value="about" className="rounded-lg data-[state=active]:bg-zinc-900 text-sm font-semibold">
                  About
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="gallery" className="outline-none space-y-4">
                {profile.contents && profile.contents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profile.contents.map((item) => (
                      <div 
                        key={item.id} 
                        className="group relative rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-violet-500/30"
                      >
                        <div className="aspect-video w-full bg-zinc-900 relative">
                          <img 
                            src={item.imageUrl} 
                            alt={item.description} 
                            className="object-cover w-full h-full"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                            <p className="text-xs text-white truncate max-w-full font-medium">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <div className="p-4 flex items-center justify-between border-t border-white/5">
                          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                            Published Post
                          </span>
                          <button className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-rose-500 transition-colors">
                            <Heart className={`h-4 w-4 ${item.isLikedByCurrentUser ? 'fill-rose-500 text-rose-500' : ''}`} />
                            <strong>{item.likesCount}</strong>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-12 border border-dashed border-white/10 rounded-2xl bg-zinc-950/20">
                    <Sparkles className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                    <p className="text-zinc-500 text-sm">No artworks published yet.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="about" className="outline-none">
                <Card className="border-white/10 bg-zinc-950/60 p-6">
                  <h4 className="text-white font-bold mb-2">Artist Information</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    This account is verified as an official Autograph creator. Support them by following, liking, and requesting exclusive custom signatures.
                  </p>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            /* Fan mode display */
            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="bg-zinc-950/80 border border-white/10 rounded-xl p-1 mb-6">
                <TabsTrigger value="activity" className="rounded-lg data-[state=active]:bg-zinc-900 text-sm font-semibold">
                  Activity
                </TabsTrigger>
                <TabsTrigger value="about" className="rounded-lg data-[state=active]:bg-zinc-900 text-sm font-semibold">
                  About Fan
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="activity" className="outline-none text-center p-12 border border-dashed border-white/10 rounded-2xl bg-zinc-950/20">
                <Sparkles className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-zinc-500 text-sm">No fan activity records found.</p>
              </TabsContent>

              <TabsContent value="about" className="outline-none">
                <Card className="border-white/10 bg-zinc-950/60 p-6">
                  <h4 className="text-white font-bold mb-2">Fan Account Details</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    A registered supporter of the Autograph platform. Connect with other fans and order high-end signature requests from verified artists.
                  </p>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Edit Profile Modal (Shadcn Dialog) */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="border-white/10 bg-zinc-900 text-white max-w-md backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Settings className="h-5 w-5 text-violet-400" />
              Edit Profile Settings
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Update your display name, biography details, and switch account type context.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Display Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Display Name
              </label>
              <Input
                type="text"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder="Ex. John Doe"
                className="h-11 border-white/10 bg-black/40 text-white placeholder:text-zinc-600 focus-visible:border-violet-500 focus-visible:ring-violet-500/30"
              />
            </div>

            {/* Bio Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Bio Description
              </label>
              <Textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Tell the community about yourself..."
                className="min-h-[100px] border-white/10 bg-black/40 text-white placeholder:text-zinc-600 focus-visible:border-violet-500 focus-visible:ring-violet-500/30"
              />
            </div>

            {/* Account Type Option Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Account Level / Type
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
                  <span className="text-xs font-bold">Fan Account</span>
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
                  <span className="text-xs font-bold">Artist Account</span>
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
              Cancel
            </Button>
            <Button
              type="button"
              disabled={savingProfile}
              onClick={handleSaveProfile}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-lg px-6 shadow-md hover:shadow-violet-600/20 cursor-pointer"
            >
              {savingProfile ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
