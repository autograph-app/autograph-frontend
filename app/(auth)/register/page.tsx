'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Sparkles, User, Mail, Lock } from 'lucide-react';
import Link from 'next/link';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const registerSchema = z.object({
  username: z.string()
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(20, { message: 'Username cannot exceed 20 characters' })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string()
    .min(6, { message: 'Password must be at least 6 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', {
        userName: values.username,
        email: values.email,
        password: values.password,
      });

      if (response.data?.success) {
        toast.success('Registration successful! Please sign in with your new account.');
        router.push('/login');
      } else {
        toast.error(response.data?.message || 'Registration failed.');
      }
    } catch (error: unknown) {
      console.error(error);
      const err = error as { response?: { data?: { message?: string } } };
      const errMsg = err.response?.data?.message || 'Registration failed. Username or email might already be in use.';
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
            Create an account to join our digital community
          </p>
        </Link>

        {/* Glassmorphic Register Card */}
        <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Create Account</CardTitle>
            <CardDescription className="text-zinc-400">
              Sign up today to discover and support your favorite artists
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
                    placeholder="johndoe"
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

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="john@example.com"
                    className="pl-10 h-11 border-white/10 bg-black/40 text-white placeholder:text-zinc-500 focus-visible:border-violet-500 focus-visible:ring-violet-500/30"
                    aria-invalid={errors.email ? 'true' : 'false'}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-500 font-medium mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Password
                </label>
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

            <CardFooter className="flex flex-col space-y-4 bg-transparent border-t-0 pt-0">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-violet-600/20 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </Button>

              <div className="text-center text-xs text-zinc-500">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-violet-400 hover:text-violet-300 hover:underline transition-colors"
                >
                  Sign in instead
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
