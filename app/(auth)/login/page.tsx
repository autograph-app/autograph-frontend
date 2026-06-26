'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Sparkles, User, Lock } from 'lucide-react';
import Link from 'next/link';

import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const loginSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      // 1. Post to login
      const loginResponse = await api.post('/auth/login', {
        userName: values.username,
        password: values.password,
      });

      if (loginResponse.data?.success) {
        const { accessToken, refreshToken } = loginResponse.data.data;

        // 2. Fetch User Profile (passing auth header explicitly to prevent outer mutation)
        const profileResponse = await api.get('/users/profile', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (profileResponse.data?.success) {
          const profile = profileResponse.data.data;
          
          // 3. Store tokens and profile in Zustand
          setAuth(accessToken, refreshToken, {
            id: profile.id,
            userName: profile.userName,
            email: profile.userName + '@autograph.com', // placeholder if not returned
            displayName: profile.displayName || undefined,
            avatarUrl: profile.avatarUrl || undefined,
            bio: profile.bio || undefined,
            accountType: profile.accountType,
            isVerified: profile.isVerified,
            isPremium: profile.isPremium,
          });

          toast.success(`Welcome back, ${profile.displayName || profile.userName}!`);
          router.push('/feed');
        } else {
          throw new Error('Failed to retrieve profile data.');
        }
      } else {
        toast.error(loginResponse.data?.message || 'Invalid username or password.');
      }
    } catch (error: unknown) {
      console.error(error);
      const err = error as { response?: { data?: { message?: string } } };
      const errMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black px-4 font-sans">
      {/* Decorative premium glow backgrounds */}
      <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-fuchsia-600/10 blur-[120px]" />
      <div className="absolute top-[40%] left-[50%] h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-[100px]" />

      <div className="z-10 w-full max-w-md animate-soft-fade">
        {/* Logo / Brand header */}
        <Link
          href="/"
          className="mb-8 flex flex-col items-center text-center cursor-pointer select-none group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30 ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-105 active:scale-95">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl group-hover:opacity-90">
            AUTOGRAPH
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Exclusive Digital Collectibles & Signatures
          </p>
        </Link>

        {/* Glassmorphic Login Card */}
        <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Sign In</CardTitle>
            <CardDescription className="text-zinc-400">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500">
                    <User className="h-4 w-4" />
                  </div>
                  <Input
                    {...register('username')}
                    type="text"
                    placeholder="Enter your username"
                    className="pl-10 h-11 border-white/10 bg-black/40 text-white placeholder:text-zinc-500 focus-visible:border-violet-500 focus-visible:ring-violet-500/30"
                    aria-invalid={errors.username ? 'true' : 'false'}
                  />
                </div>
                {errors.username && (
                  <p className="text-xs text-rose-500 font-medium mt-1">
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-11 border-white/10 bg-black/40 text-white placeholder:text-zinc-500 focus-visible:border-violet-500 focus-visible:ring-violet-500/30"
                    aria-invalid={errors.password ? 'true' : 'false'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-500 font-medium mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 bg-transparent border-t-0 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/10 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Signing In...
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>

              <div className="text-center text-xs text-zinc-500">
                Don&apos;t have an account?{' '}
                <Link
                  href="/register"
                  className="font-semibold text-violet-400 hover:text-violet-300 hover:underline transition-colors"
                >
                  Create one now
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
