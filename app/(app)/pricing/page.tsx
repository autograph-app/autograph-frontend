'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Loader2, CreditCard, Shield, Zap, BadgeHelp } from 'lucide-react';
import { useI18n } from '@/components/providers/I18nProvider';

export default function PricingPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user && user.accountType === 1) {
      router.replace('/feed');
      toast.error(t('pricing.error.artistBlocked'));
    }
  }, [user, router, t]);

  const handleUpgrade = async () => {
    if (!token) {
      toast.error(t('pricing.error.loginRequired'));
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      // Create a checkout session using a test plan ID
      const response = await api.post('/billing/checkout', {
        planId: 'price_1QAutographPremiumMonthlyTest'
      });

      if (response.data?.success && response.data?.data) {
        window.location.href = response.data.data;
      } else {
        toast.error(t('pricing.error.checkoutFailed'));
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err.response?.data?.message || t('pricing.error.generic');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setLoading(true);
    try {
      const response = await api.post('/billing/portal');
      if (response.data?.success && response.data?.data) {
        window.location.href = response.data.data;
      } else {
        toast.error(t('pricing.error.portalFailed'));
      }
    } catch (error) {
      console.error('Portal error:', error);
      toast.error(t('pricing.error.billingPortalUnavailable'));
    } finally {
      setLoading(false);
    }
  };

  const freeFeatures = [
    'pricing.feature.free.signatures',
    'pricing.feature.free.profile',
    'pricing.feature.free.feed',
    'pricing.feature.free.support',
  ];

  const premiumFeatures = [
    'pricing.feature.premium.signatures',
    'pricing.feature.premium.badge',
    'pricing.feature.premium.analytics',
    'pricing.feature.premium.backoffice',
    'pricing.feature.premium.gallery',
    'pricing.feature.premium.support',
  ];

  return (
    <div className="space-y-12 py-6 relative">
      {/* Visual background lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-80 h-80 bg-fuchsia-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-semibold text-violet-400">
          <Sparkles className="h-3 w-3 animate-spin" style={{ animationDuration: '3s' }} />
          <span>{t('pricing.badge')}</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
          {t('pricing.title')}
        </h1>
        <p className="text-zinc-400 text-lg">
          {t('pricing.subtitle')}
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto relative">
        
        {/* Free Plan */}
        <Card className="border-white/10 bg-zinc-950/40 backdrop-blur-md flex flex-col justify-between hover:border-white/20 transition-all duration-300">
          <CardHeader className="p-6">
            <CardTitle className="text-xl font-bold text-zinc-300">{t('pricing.free.title')}</CardTitle>
            <CardDescription className="text-zinc-500">{t('pricing.free.description')}</CardDescription>
            <div className="mt-4 flex items-baseline text-white">
              <span className="text-4xl font-extrabold tracking-tight">$0</span>
              <span className="ml-1 text-xl font-semibold text-zinc-500">{t('pricing.free.month')}</span>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 pt-0 flex-1">
            <ul className="space-y-4">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-zinc-400">
                  <Check className="h-4 w-4 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span>{t(feature)}</span>
                </li>
              ))}
            </ul>
          </CardContent>

          <CardFooter className="p-6 pt-0">
            <Button 
              variant="outline" 
              className="w-full border-white/10 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 cursor-pointer py-5 rounded-xl font-semibold"
              disabled
            >
              {user && !user.isPremium ? t('pricing.free.active') : t('pricing.free.trial')}
            </Button>
          </CardFooter>
        </Card>

        {/* Premium Plan */}
        <Card className="border-violet-500/30 bg-gradient-to-b from-zinc-900/60 to-zinc-950/60 backdrop-blur-md flex flex-col justify-between shadow-2xl shadow-violet-500/5 hover:border-violet-500/50 transition-all duration-300 relative overflow-hidden group">
          {/* Subtle glowing borders */}
          <div className="absolute top-0 right-0 bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-wider uppercase">
            {t('pricing.premium.popular')}
          </div>

          <CardHeader className="p-6">
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-400" />
              {t('pricing.premium.title')}
            </CardTitle>
            <CardDescription className="text-zinc-400">{t('pricing.premium.description')}</CardDescription>
            <div className="mt-4 flex items-baseline text-white">
              <span className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                $9.99
              </span>
              <span className="ml-1 text-xl font-semibold text-zinc-400">{t('pricing.premium.month')}</span>
            </div>
          </CardHeader>

          <CardContent className="p-6 pt-0 flex-1">
            <ul className="space-y-4">
              {premiumFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-zinc-300">
                  <Check className="h-4 w-4 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span>{t(feature)}</span>
                </li>
              ))}
            </ul>
          </CardContent>

          <CardFooter className="p-6 pt-0">
            {user?.isPremium ? (
              <Button 
                onClick={handleManageBilling}
                disabled={loading}
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white cursor-pointer py-5 rounded-xl font-semibold shadow-lg shadow-violet-500/20"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> {t('pricing.premium.redirecting')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2 justify-center">
                    <CreditCard className="h-4 w-4" /> {t('pricing.premium.manage')}
                  </span>
                )}
              </Button>
            ) : (
              <Button 
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white cursor-pointer py-5 rounded-xl font-semibold shadow-lg shadow-violet-500/20"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> {t('pricing.premium.startingCheckout')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2 justify-center">
                    <Zap className="h-4 w-4" /> {t('pricing.premium.upgrade')}
                  </span>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Security Assurance Footer */}
      <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-white/5 relative">
        <div className="flex flex-col items-center text-center space-y-2">
          <Shield className="h-6 w-6 text-zinc-500" />
          <h4 className="text-xs font-semibold text-zinc-300">{t('pricing.footer.secure.title')}</h4>
          <p className="text-[11px] text-zinc-500 leading-normal">{t('pricing.footer.secure.description')}</p>
        </div>
        <div className="flex flex-col items-center text-center space-y-2">
          <CreditCard className="h-6 w-6 text-zinc-500" />
          <h4 className="text-xs font-semibold text-zinc-300">{t('pricing.footer.cancel.title')}</h4>
          <p className="text-[11px] text-zinc-500 leading-normal">{t('pricing.footer.cancel.description')}</p>
        </div>
        <div className="flex flex-col items-center text-center space-y-2">
          <BadgeHelp className="h-6 w-6 text-zinc-500" />
          <h4 className="text-xs font-semibold text-zinc-300">{t('pricing.footer.support.title')}</h4>
          <p className="text-[11px] text-zinc-500 leading-normal">{t('pricing.footer.support.description')}</p>
        </div>
      </div>
    </div>
  );
}
