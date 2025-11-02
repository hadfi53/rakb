import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Cookie } from 'lucide-react';
import { cn } from '@/lib/utils';

const COOKIE_CONSENT_KEY = 'rakb_cookie_consent';
const COOKIE_PREFERENCES_KEY = 'rakb_cookie_preferences';

export interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always true, cannot be disabled
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if consent was already given
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);

    if (consent === 'accepted' && savedPreferences) {
      try {
        const prefs = JSON.parse(savedPreferences);
        setPreferences(prefs);
        loadAnalytics(prefs);
      } catch (e) {
        if (import.meta.env.DEV) {
        console.error('Error parsing cookie preferences:', e);
        }
      }
    } else {
      // Show banner if consent not given
      setShowBanner(true);
    }
  }, []);

  const loadAnalytics = (prefs: CookiePreferences) => {
    if (prefs.analytics && import.meta.env.VITE_GA_MEASUREMENT_ID) {
      // Load Google Analytics only after consent
      if (typeof window !== 'undefined' && !(window as any).ga) {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${import.meta.env.VITE_GA_MEASUREMENT_ID}`;
        document.head.appendChild(script);

        script.onload = () => {
          (window as any).dataLayer = (window as any).dataLayer || [];
          function gtag(...args: any[]) {
            (window as any).dataLayer.push(args);
          }
          (window as any).gtag = gtag;
          gtag('js', new Date());
          gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID);
        };
      }
    }

    // Load Plausible if configured
    if (prefs.analytics && import.meta.env.VITE_PLAUSIBLE_DOMAIN) {
      if (typeof window !== 'undefined' && !(window as any).plausible) {
        const script = document.createElement('script');
        script.defer = true;
        script.dataset.domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
        script.src = 'https://plausible.io/js/script.js';
        document.head.appendChild(script);
      }
    }
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      analytics: true,
      marketing: true,
    };
    saveConsent(allAccepted);
  };

  const handleRejectAll = () => {
    const onlyEssential: CookiePreferences = {
      essential: true,
      analytics: false,
      marketing: false,
    };
    saveConsent(onlyEssential);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
    setShowSettings(false);
  };

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    setShowBanner(false);
    loadAnalytics(prefs);
  };

  if (!showBanner && !showSettings) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed inset-x-0 z-50 transition-all duration-300',
        showBanner || showSettings ? 'bottom-0' : '-bottom-full'
      )}
    >
      <Card className="mx-4 mb-4 shadow-2xl border-2 max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Cookie className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Gestion des cookies</CardTitle>
                <CardDescription>
                  Nous utilisons des cookies pour améliorer votre expérience sur notre site
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowBanner(false);
                setShowSettings(false);
              }}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showSettings ? (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Cookies essentiels</p>
                    <p className="text-sm text-gray-600">
                      Nécessaires au fonctionnement du site (toujours actifs)
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">Toujours actif</div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Cookies analytiques</p>
                    <p className="text-sm text-gray-600">
                      Nous aident à comprendre comment vous utilisez notre site
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) =>
                        setPreferences({ ...preferences, analytics: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Cookies marketing</p>
                    <p className="text-sm text-gray-600">
                      Utilisés pour vous montrer des publicités pertinentes
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) =>
                        setPreferences({ ...preferences, marketing: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSavePreferences} className="flex-1">
                  Enregistrer les préférences
                </Button>
                <Button variant="outline" onClick={() => setShowSettings(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Ce site utilise des cookies pour améliorer votre expérience. Les cookies
                essentiels sont nécessaires au fonctionnement du site. Vous pouvez choisir
                d'accepter ou de refuser les cookies non essentiels.
              </p>
              <p className="text-xs text-gray-500">
                Pour plus d'informations, consultez notre{' '}
                <a href="/legal/privacy" className="text-primary hover:underline">
                  politique de confidentialité
                </a>
                .
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleAcceptAll} className="flex-1">
                  Tout accepter
                </Button>
                <Button onClick={handleRejectAll} variant="outline" className="flex-1">
                  Tout refuser
                </Button>
                <Button
                  onClick={() => setShowSettings(true)}
                  variant="secondary"
                  className="flex-1"
                >
                  Personnaliser
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CookieConsent;

