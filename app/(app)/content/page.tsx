'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { UploadCloud, Sparkles, Check, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ContentPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Only image files are supported.');
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please upload an image first.');
      return;
    }
    if (!title.trim()) {
      toast.error('Please enter a title.');
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
      formData.append('file', file);

      const response = await api.post('/contents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.success) {
        toast.success('Artwork published successfully!');
        setFile(null);
        setPreviewUrl(null);
        setTitle('');
        setDescription('');
        router.push(user ? `/profile/${user.userName}` : '/feed');
      } else {
        toast.error(response.data?.message || 'Failed to publish artwork.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'An error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-violet-400" />
          Share Premium Content
        </h1>
        <p className="text-zinc-400 text-sm">Publish digital arts, photos, and collectibles for signature requests</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Creation Form */}
        <Card className="lg:col-span-2 border-white/10 bg-zinc-950/60 backdrop-blur-md relative overflow-hidden">
          {isUploading && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-300 select-none">
              <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
              <div className="text-center space-y-1">
                <p className="text-white font-bold text-sm">Publishing Artwork...</p>
                <p className="text-zinc-400 text-xs max-w-xs px-4">
                  Please wait while we optimize your image and run safety checks.
                </p>
              </div>
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">Upload New Artwork</CardTitle>
            <CardDescription className="text-zinc-400 text-xs">
              Upload standard high-resolution images to expose to your profile gallery.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* File Upload Area */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                  Artwork Image
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
                        <img src={previewUrl} alt="Preview" className="object-cover w-full h-full" />
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
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center space-y-2 text-zinc-400">
                      <UploadCloud className="h-10 w-10 mx-auto text-zinc-500" />
                      <p className="text-sm font-semibold text-white">Click or Drag Image to Upload</p>
                      <p className="text-xs text-zinc-500">Supports PNG, JPG up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Artwork Title
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter artwork title..."
                  required
                  disabled={isUploading}
                  className="border-white/10 bg-black/40 text-white placeholder:text-zinc-600 focus-visible:border-violet-500 focus-visible:ring-violet-500/30"
                />
              </div>

              {/* Description Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Description / Caption
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your digital asset or canvas details..."
                  disabled={isUploading}
                  className="min-h-[100px] border-white/10 bg-black/40 text-white placeholder:text-zinc-600 focus-visible:border-violet-500 focus-visible:ring-violet-500/30"
                />
              </div>

              <Button
                type="submit"
                disabled={isUploading || !file}
                className="w-full h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-violet-600/20 active:scale-95 transition-all duration-150 cursor-pointer"
              >
                {isUploading ? 'Publishing...' : 'Publish to Gallery'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Informative Side Panel */}
        <div className="space-y-6">
          <Card className="border-white/10 bg-zinc-950/60 p-5 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Info className="h-4 w-4 text-violet-400" />
              Publishing Guidelines
            </h3>
            <ul className="space-y-3 text-xs text-zinc-400">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>You must own the intellectual property rights to any digital media you publish.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Recommended resolution is 1920x1080 or square 1:1 aspect ratio.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Artworks published by verified Artists become eligible for digital autograph sign requests.</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
