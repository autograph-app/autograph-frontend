'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';

export default function ProfileRedirectPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user?.userName) {
      router.replace(`/profile/${user.userName}`);
    } else {
      router.replace('/login');
    }
  }, [user, router]);

  return (
    <div className="flex flex-1 items-center justify-center min-h-[300px]">
      <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
    </div>
  );
}
