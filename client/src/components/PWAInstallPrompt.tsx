import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

const DISMISS_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes re-trigger cooldown

const PWAInstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOSDevice, setIsIOSDevice] = useState(false);
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);

    useEffect(() => {
        // 1. Check if running in standalone mode (already installed & running as app)
        const checkStandalone = () => {
            const isStandaloneMode =
                window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true ||
                document.referrer.includes('android-app://');
            return isStandaloneMode;
        };

        if (checkStandalone()) {
            setIsInstalled(true);
            return;
        }

        // 2. Detect iOS Safari
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
        setIsIOSDevice(isIOS);

        // 3. Check dismissal timestamp
        const shouldShowPrompt = () => {
            const lastDismissed = localStorage.getItem('pwa_prompt_dismissed_time');
            if (!lastDismissed) return true;
            const elapsed = Date.now() - parseInt(lastDismissed, 10);
            return elapsed > DISMISS_COOLDOWN_MS;
        };

        // 4. Android/Chrome beforeinstallprompt listener
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            if (shouldShowPrompt()) {
                setIsVisible(true);
            }
        };

        // 5. appinstalled listener
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsVisible(false);
            setDeferredPrompt(null);
            localStorage.removeItem('pwa_prompt_dismissed_time');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        // On iOS or browsers where prompt event hasn't fired yet, check cooldown and show prompt
        if (shouldShowPrompt()) {
            // Small delay to allow initial load to settle
            const timer = setTimeout(() => {
                if (!checkStandalone()) {
                    setIsVisible(true);
                }
            }, 2500);
            return () => {
                clearTimeout(timer);
                window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
                window.removeEventListener('appinstalled', handleAppInstalled);
            };
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            // Native install prompt (Chrome / Android / Edge)
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setIsVisible(false);
                setDeferredPrompt(null);
                setIsInstalled(true);
            }
        } else if (isIOSDevice) {
            // Show iOS step-by-step instructions
            setShowIOSInstructions(true);
        } else {
            // Browser doesn't support automatic prompt: show fallback guidance
            alert('To install ElectroCare: Open your browser menu (⋮ or ...) and tap "Install App" or "Add to Home screen".');
        }
    };

    const handleDismiss = () => {
        // Record timestamp for 15-minute cooldown (constantly re-triggers on uninstalled devices)
        localStorage.setItem('pwa_prompt_dismissed_time', Date.now().toString());
        setIsVisible(false);
    };

    // If already installed and running standalone, do not render anything
    if (isInstalled) return null;

    return (
        <>
            {/* Main Interactive Install Banner */}
            {isVisible ? (
                <div className="fixed bottom-24 md:bottom-8 left-4 right-4 md:left-auto md:right-8 md:w-[400px] z-[120] animate-in fade-in slide-in-from-bottom-5 duration-500">
                    <div className="glass-card rounded-[2rem] p-6 border border-brand/30 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
                        {/* Glow accent */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/15 blur-3xl -mr-16 -mt-16 pointer-events-none" />

                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand/20 to-accent/20 border border-brand/30 flex items-center justify-center text-3xl shadow-inner shrink-0">
                                📱
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-black text-lg tracking-tight text-foreground">
                                        Install ElectroCare
                                    </h3>
                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-brand/20 text-brand">
                                        PWA App
                                    </span>
                                </div>
                                <p className="text-xs text-foreground/70 font-medium leading-relaxed">
                                    Instant device repair booking, offline order tracking & real-time notifications on your home screen.
                                </p>
                            </div>
                        </div>

                        {showIOSInstructions ? (
                            <div className="p-4 rounded-xl bg-surface/80 border border-brand/20 text-xs space-y-2 mb-4 animate-in fade-in">
                                <p className="font-bold text-foreground">Install on iPhone / iPad:</p>
                                <ol className="list-decimal list-inside space-y-1 text-foreground/80">
                                    <li>Tap the <span className="font-bold text-brand">Share</span> button in Safari (icon at bottom)</li>
                                    <li>Scroll down and select <span className="font-bold text-brand">Add to Home Screen</span> (➕)</li>
                                    <li>Tap <span className="font-bold text-brand">Add</span> in the top right corner</li>
                                </ol>
                                <button
                                    onClick={() => setShowIOSInstructions(false)}
                                    className="text-[10px] text-brand font-black uppercase tracking-wider underline mt-2 block"
                                >
                                    Close instructions
                                </button>
                            </div>
                        ) : null}

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleInstall}
                                className="flex-1 py-3 px-5 rounded-xl bg-brand text-[#03131e] font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-brand/20 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span>⚡</span> Install Now
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="py-3 px-5 rounded-xl bg-surface/50 border border-border-glass text-foreground/60 hover:text-foreground font-black text-xs uppercase tracking-widest active:scale-95 transition-all cursor-pointer"
                            >
                                Later
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* Persistent Floating Action Pill for uninstalled devices */
                <button
                    onClick={() => {
                        setIsVisible(true);
                        setShowIOSInstructions(false);
                    }}
                    title="Install ElectroCare Web-App"
                    aria-label="Install App"
                    className="fixed bottom-24 md:bottom-8 right-4 z-[110] glass-card px-4 py-2.5 rounded-full border border-brand/40 shadow-xl hover:scale-105 active:scale-95 transition-premium flex items-center gap-2 group cursor-pointer"
                >
                    <span className="w-2.5 h-2.5 rounded-full bg-brand animate-ping" />
                    <span className="text-xs font-black uppercase tracking-widest text-brand group-hover:underline">
                        📲 Install App
                    </span>
                </button>
            )}
        </>
    );
};

export default PWAInstallPrompt;

