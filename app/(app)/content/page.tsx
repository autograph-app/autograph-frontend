'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { UploadCloud, Sparkles, Check, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/components/providers/I18nProvider';

export default function ContentPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('DigitalArts');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [artists, setArtists] = useState<any[]>([]);
  const [selectedArtistId, setSelectedArtistId] = useState<string>('');
  const [personalMessage, setPersonalMessage] = useState('');

  React.useEffect(() => {
    if (user && user.accountType === 1) {
      router.replace('/feed');
      toast.error(t('content.page.error.artistCannotPublish'));
    }
  }, [user, router, t]);

  React.useEffect(() => {
    const fetchArtists = async () => {
      try {
        const { api } = await import('@/lib/api');
        const response = await api.get('/users/artists');
        if (response.data?.success) {
          setArtists(response.data.data);
        }
      } catch (err) {
        console.error('Failed to load artists:', err);
      }
    };
    fetchArtists();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      toast.error(t('content.page.error.imageOnly'));
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error(t('content.page.error.uploadFirst'));
      return;
    }
    if (!title.trim()) {
      toast.error(t('content.page.error.titleRequired'));
      return;
    }

    setIsUploading(true);
    try {
      const { api } = await import('@/lib/api');
      const formData = new FormData();
      formData.append('title', title.trim());
      if (description.trim()) {
        formData.append('description', description.trim());
      }
      formData.append('category', category);
      formData.append('file', file);

      const response = await api.post('/contents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.success) {
        const publishedContent = response.data.data;
        if (selectedArtistId) {
          try {
            await api.post('/signature-requests', {
              contentId: publishedContent.id,
              artistId: selectedArtistId,
              message: personalMessage.trim() || undefined
            });
            toast.success(t('content.page.requestSent'));
          } catch (sigErr) {
            console.error('Failed to auto-request signature:', sigErr);
          }
        }

        toast.success(t('content.page.success.published'));
        setFile(null);
        setPreviewUrl(null);
        setTitle('');
        setDescription('');
        setCategory('DigitalArts');
        setSelectedArtistId('');
        setPersonalMessage('');
        router.push(user ? `/profile/${user.userName}` : '/feed');
      } else {
        toast.error(response.data?.message || t('content.page.error.publishFailed'));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || t('content.page.error.uploadFailed'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-violet-400" />
          {t('content.page.title')}
        </h1>
        <p className="text-zinc-400 text-sm">{t('content.page.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Creation Form */}
        <Card className="lg:col-span-2 border-white/10 bg-zinc-950/60 backdrop-blur-md relative overflow-hidden">
          {isUploading && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-300 select-none">
              <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
              <div className="text-center space-y-1">
                <p className="text-white font-bold text-sm">{t('content.page.uploading.title')}</p>
                <p className="text-zinc-400 text-xs max-w-xs px-4">{t('content.page.uploading.subtitle')}</p>
              </div>
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">{t('content.page.cardTitle')}</CardTitle>
            <CardDescription className="text-zinc-400 text-xs">{t('content.page.cardDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* File Upload Area */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                  {t('content.page.artworkImage')}
                </label>
                <div 
                  onClick={() => !isUploading && document.getElementById('artwork-input')?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all duration-300 ${
                    isUploading 
                      ? 'cursor-not-allowed opacity-50 border-white/5 bg-zinc-900/10'
                      : previewUrl 
                        ? 'border-violet-500 bg-violet-500/5 cursor-pointer' 
                        : 'border-white/10 hover:border-white/20 bg-black/40 cursor-pointer'
                  }`}
                >
                  <input
                    type="file"
                    id="artwork-input"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*"
                    disabled={isUploading}
                  />
                  {previewUrl ? (
                    <div className="space-y-4 text-center w-full max-w-sm">
                      <div className="aspect-video w-full rounded-lg overflow-hidden border border-white/10 relative mx-auto bg-zinc-900">
                        <Image src={previewUrl} alt={t('content.page.previewAlt')} className="object-cover w-full h-full" fill />
                      </div>
                      <p className="text-xs text-zinc-400 truncate font-semibold">{file?.name}</p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="h-8 border-white/10 text-xs hover:bg-white/5 cursor-pointer"
                        disabled={isUploading}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          setPreviewUrl(null);
                        }}
                      >
                        {t('content.page.remove')}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center space-y-2 text-zinc-400">
                      <UploadCloud className="h-10 w-10 mx-auto text-zinc-500" />
                      <p className="text-sm font-semibold text-white">{t('content.page.clickOrDrag')}</p>
                      <p className="text-xs text-zinc-500">{t('content.page.supports')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  {t('content.page.artworkTitle')}
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('content.page.titlePlaceholder')}
                  required
                  disabled={isUploading}
                  className="border-white/10 bg-black/40 text-white placeholder:text-zinc-600 focus-visible:border-violet-500 focus-visible:ring-violet-500/30"
                />
              </div>

              {/* Description Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  {t('content.page.description')}
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('content.page.descriptionPlaceholder')}
                  disabled={isUploading}
                  className="min-h-[100px] border-white/10 bg-black/40 text-white placeholder:text-zinc-600 focus-visible:border-violet-500 focus-visible:ring-violet-500/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  {t('content.page.category')}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={isUploading}
                  className="h-10 w-full rounded-md border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-violet-500"
                >
                  <option value="DigitalArts" className="bg-zinc-900">{t('content.page.category.digital')}</option>
                  <option value="SportsMemorabilia" className="bg-zinc-900">{t('content.page.category.sports')}</option>
                  <option value="MusicCollectibles" className="bg-zinc-900">{t('content.page.category.music')}</option>
                </select>
              </div>

              {/* Optional Artist Selection for Autograph request */}
              <div className="space-y-1.5 border-t border-white/5 pt-4">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                  Select Artist for Signature Request (Optional)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <select
                      value={selectedArtistId}
                      onChange={(e) => setSelectedArtistId(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg border border-white/10 bg-black text-white focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm cursor-pointer"
                      disabled={isUploading}
                    >
                      <option value="" className="bg-zinc-950 text-zinc-500">-- None (Do not request signature) --</option>
                      {artists.map((artist) => (
                        <option key={artist.id} value={artist.id} className="bg-zinc-950 text-white">
                          {artist.displayName || artist.userName} (@{artist.userName})
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedArtistId && (
                    <div>
                      <Input
                        placeholder="Add a friendly message (optional)..."
                        value={personalMessage}
                        onChange={(e) => setPersonalMessage(e.target.value)}
                        className="border-white/10 bg-black/40 text-white placeholder:text-zinc-600 focus-visible:border-violet-500"
                        disabled={isUploading}
                        maxLength={200}
                      />
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isUploading || !file}
                className="w-full h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-violet-600/20 active:scale-95 transition-all duration-150 cursor-pointer"
              >
                {isUploading ? t('content.page.publishing') : t('content.page.publish')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Informative Side Panel */}
        <div className="space-y-6">
          <Card className="border-white/10 bg-zinc-950/60 p-5 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Info className="h-4 w-4 text-violet-400" />
              {t('content.page.guidelines.title')}
            </h3>
            <ul className="space-y-3 text-xs text-zinc-400">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{t('content.page.guidelines.ownership')}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{t('content.page.guidelines.resolution')}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{t('content.page.guidelines.eligibility')}</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
