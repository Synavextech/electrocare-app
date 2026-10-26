import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import Footer from '../components/Footer';
import useAuth from '../hooks/useAuth';
import apiClient from '../utils/apiClient';
import AIDiagnostic from '../components/AIDiagnostic';
import RoleApplicationModal from '../components/RoleApplicationModal';
import ThemeToggle from '../components/ThemeToggle';
import SoftwareAndCustomAppsSection from '../components/SoftwareAndCustomAppsSection';

const Landing = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
    const [applicationRole, setApplicationRole] = useState<'technician' | 'delivery'>('technician');

    // Fetch marketplace listings for Hot Offers preview
    const { data: marketplaceListings = [], isLoading: isLoadingMarketplace } = useQuery({
        queryKey: ['marketplace-preview'],
        queryFn: async () => {
            const res = await apiClient.get('/marketplace');
            const data = Array.isArray(res.data) ? res.data : [];
            return data;
        },
        staleTime: 60000,
    });

    const handlePurchaseAttempt = (_listingId?: string) => {
        if (!user) {
            navigate({ to: '/login' });
        } else {
            navigate({ to: '/marketplace' });
        }
    };

    // Filter Hot Offers: items flagged as hot, refurbished/new deals, or featured
    const hotOffers = marketplaceListings.filter((item: any) => 
        item.isHotOffer === true ||
        item.hotOffer === true ||
        item.condition === 'Refurbished' ||
        item.condition === 'New' ||
        (item.piecesAvailable !== undefined && item.piecesAvailable > 0 && item.piecesAvailable <= 5)
    );

    // Fallback if none flagged explicitly: use available active listings
    const activeDisplayListings = hotOffers.length > 0 ? hotOffers : marketplaceListings;

    // Group items by category
    const categoryGroups = [
        {
            key: 'Mobile Devices',
            title: 'Hot Mobile & Smartphones',
            icon: '📱',
            items: activeDisplayListings.filter((i: any) => 
                i.mainCategory === 'Mobile Devices' || 
                i.mainCategory === 'Phones' || 
                (!i.mainCategory && (i.device?.toLowerCase().includes('iphone') || i.device?.toLowerCase().includes('samsung') || i.device?.toLowerCase().includes('pixel')))
            )
        },
        {
            key: 'Computers/Laptops',
            title: 'Hot Laptops & Computers',
            icon: '💻',
            items: activeDisplayListings.filter((i: any) => 
                i.mainCategory === 'Computers/Laptops' || 
                i.mainCategory === 'Laptop' ||
                (!i.mainCategory && (i.device?.toLowerCase().includes('macbook') || i.device?.toLowerCase().includes('dell') || i.device?.toLowerCase().includes('thinkpad') || i.device?.toLowerCase().includes('hp')))
            )
        },
        {
            key: 'Gaming devices',
            title: 'Hot Gaming Consoles & Gear',
            icon: '🎮',
            items: activeDisplayListings.filter((i: any) => 
                i.mainCategory === 'Gaming devices' ||
                (!i.mainCategory && (i.device?.toLowerCase().includes('playstation') || i.device?.toLowerCase().includes('xbox') || i.device?.toLowerCase().includes('nintendo')))
            )
        },
        {
            key: 'Internet connection devices & services',
            title: 'Hot Internet & Networking Routers',
            icon: '🌐',
            items: activeDisplayListings.filter((i: any) => 
                i.mainCategory === 'Internet connection devices & services' ||
                (!i.mainCategory && (i.device?.toLowerCase().includes('router') || i.device?.toLowerCase().includes('mifi') || i.device?.toLowerCase().includes('starlink')))
            )
        },
        {
            key: 'Security devices and accessories',
            title: 'Hot Security & Smart Tech',
            icon: '📹',
            items: activeDisplayListings.filter((i: any) => 
                i.mainCategory === 'Security devices and accessories' ||
                (!i.mainCategory && (i.device?.toLowerCase().includes('camera') || i.device?.toLowerCase().includes('cctv') || i.device?.toLowerCase().includes('alarm')))
            )
        }
    ].filter(cat => cat.items.length > 0);

    return (
        <div className="min-h-screen flex flex-col bg-canvas text-foreground font-sans transition-colors duration-300">
            {/* Top Navigation Bar on Landing Page */}
            <header className="fixed top-0 left-0 right-0 z-50 nav-blur px-6 py-4 flex items-center justify-between border-b border-border-glass">
                <Link to="/" className="flex items-center gap-2">
                    <span className="text-2xl font-black tracking-tighter uppercase">
                        ELECTRO<span className="text-brand italic">CARE</span>
                    </span>
                </Link>

                <div className="flex items-center gap-4">
                    <Link to="/marketplace" className="text-xs font-bold uppercase tracking-widest text-foreground/70 hover:text-brand transition-colors hidden sm:block">
                        Marketplace
                    </Link>
                    <Link to="/schedule" className="text-xs font-bold uppercase tracking-widest text-foreground/70 hover:text-brand transition-colors hidden sm:block">
                        Repairs
                    </Link>
                    <Link to="/tracking" className="text-xs font-bold uppercase tracking-widest text-foreground/70 hover:text-brand transition-colors hidden md:block">
                        Track
                    </Link>
                    <Link to={user ? "/home" : "/login"} className="px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest bg-brand/10 border border-brand/30 text-brand hover:bg-brand hover:text-black transition-all">
                        {user ? 'Dashboard' : 'Login'}
                    </Link>
                    <ThemeToggle />
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative min-h-screen w-full overflow-hidden flex flex-col pt-16">
                <div className="absolute inset-0">
                    <img
                        src="/images/hero.gif"
                        alt="Electro-Care Hero"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60" />
                </div>

                <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center text-white px-4 pt-20">
                    <div className="mb-6 inline-block bg-primary/20 backdrop-blur-md border border-primary/30 px-6 py-2 rounded-full shadow-lg">
                        <span className="text-primary font-bold tracking-widest uppercase text-xs animate-pulse">
                            🚀 Get AI-Powered Diagonostics Live
                        </span>
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 uppercase drop-shadow-2xl">
                        ELECTRO<span className="text-primary italic">CARE</span>
                    </h1>
                    <p className="text-xl md:text-3xl font-light tracking-wide max-w-4xl mx-auto mb-12 drop-shadow-lg opacity-90 leading-relaxed">
                        Next-Gen <span className="text-primary font-bold">Laptop & Mobile</span> Repair. <br className="hidden md:block" />
                        AI-Aided Precision. Ethical Recycling. Premium Marketplace.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6">
                        <Link to={user ? "/home" : "/login"}>
                            <span className="cursor-pointer bg-primary hover:bg-white hover:text-primary text-white px-12 py-5 rounded-full uppercase tracking-widest text-sm font-black transition-all duration-500 border-2 border-primary shadow-[0_0_40px_rgba(34,197,94,0.4)] block">
                                {user ? 'View Dashboard' : 'Login Now'}
                            </span>
                        </Link>
                        <Link to="/schedule">
                            <span className="cursor-pointer bg-transparent hover:bg-white/10 text-white px-12 py-5 rounded-full uppercase tracking-widest text-sm font-black transition-all duration-500 border-2 border-white/30 backdrop-blur-md block">
                                Schedule Your Repair Now
                            </span>
                        </Link>
                    </div>
                    <div className="mt-8 flex flex-col items-center gap-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button onClick={() => { setApplicationRole('technician'); setIsApplicationModalOpen(true); }} className="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full uppercase tracking-widest text-xs font-black transition-all duration-300 border border-white/20 backdrop-blur-md flex items-center justify-center gap-2">
                                <span>👨‍🔧</span> We are Hiring: Technicians
                            </button>
                            <button onClick={() => { setApplicationRole('delivery'); setIsApplicationModalOpen(true); }} className="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full uppercase tracking-widest text-xs font-black transition-all duration-300 border border-white/20 backdrop-blur-md flex items-center justify-center gap-2">
                                <span>🚚</span> We are Hiring: Delivery Fleet
                            </button>
                        </div>
                    </div>
                </div>

                {/* Operational Services Integration in Hero */}
                <div className="relative z-10 w-full bg-gradient-to-t from-black/90 to-transparent pt-20 pb-10">
                    <div className="container mx-auto px-4">
                        <div className="grid md:grid-cols-4 gap-6">
                            {[
                                { title: 'Phone Repair/Diagnostics', icon: '📱', desc: 'Self-diagnostic AI for instant checks.', link: '/schedule' },
                                { title: 'Computer Repair/Diagnostics', icon: '💻', desc: 'Motherboard & component specialists.', link: '/schedule' },
                                { title: 'Buy & Sell Tech', icon: '🛒', desc: 'Buy & sell verified tech assets.', link: '/marketplace' },
                                { title: 'Recycling', icon: '♻️', desc: 'Turn dead devices into cash/points.', link: '/marketplace?tab=sell' }
                            ].map((service, i) => (
                                <Link key={i} to={service.link}>
                                    <div className="group p-8 backdrop-blur-lg bg-white/5 border border-white/10 rounded-3xl hover:bg-primary/10 hover:border-primary transition-all duration-500 cursor-pointer h-full relative overflow-hidden">
                                        <div className="absolute -right-4 -top-4 text-white/5 text-8xl transition-all group-hover:text-primary/10">{service.icon}</div>
                                        <div className="relative z-10">
                                            <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-500 bg-white/10 w-16 h-16 flex items-center justify-center rounded-2xl shadow-inner">{service.icon}</div>
                                            <h3 className="text-xl font-black mb-2 text-white uppercase tracking-wider">{service.title}</h3>
                                            <p className="text-white/60 font-light text-sm leading-relaxed">{service.desc}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
            {/* About Services Grid */}
            <section className="py-24 bg-surface/50 border-t border-b border-border-glass">
                <div className="container mx-auto px-4 text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black text-foreground uppercase tracking-tighter mb-4">Our <span className="text-brand">Service Delivery</span></h2>
                    <p className="text-foreground/70 max-w-2xl mx-auto">We offer comprehensive solutions for all your electronic needs, from AI-powered repairs to a seamless marketplace.</p>
                </div>

                <div className="container mx-auto px-4 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        {
                            title: "Mobile Solutions",
                            desc: "Repair models, buy new, upgrade, or sell old phones.",
                            img: "/images/repairpro.gif",
                            actions: ["Repair", "Buy", "Sell", "Swap"]
                        },
                        {
                            title: "Computers & Laptops Repair",
                            desc: "Pro Computers/Laptops repairs, new arrivals, and trade-in options.",
                            img: "/images/fixit.gif",
                            actions: ["Repair", "Buy", "Sell", "Swap"]
                        },
                        {
                            title: "Tech Marketplace",
                            desc: "Secure platform to buy new and sell used electronics.",
                            img: "/images/check_out.gif",
                            actions: ["Listed", "Secure", "Verified", "Facilitated"]
                        }
                    ].map((service, i) => (
                        <div key={i} className="glass-card rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col group border border-border-glass">
                            <div className="h-48 overflow-hidden relative">
                                <img src={service.img} alt={service.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute top-4 left-4 bg-canvas/80 backdrop-blur-sm px-3 py-1 rounded-full text-lg shadow-sm"></div>
                            </div>
                            <div className="p-8 flex-1 flex flex-col">
                                <h3 className="text-xl font-bold mb-3 text-foreground uppercase tracking-tight">{service.title}</h3>
                                <p className="text-foreground/70 text-sm mb-6 flex-1">{service.desc}</p>
                                <div className="flex flex-wrap gap-2">
                                    {service.actions.map((action, j) => (
                                        <span key={j} className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-surface border border-border-glass rounded-full text-foreground/70">
                                            {action}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Software, Custom Applications & Enterprise Connectivity Section */}
            <SoftwareAndCustomAppsSection />

            {/* Marketplace Hot Offers Showcase */}
            <section className="w-full bg-canvas py-24 relative overflow-hidden border-t border-border-glass">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(0,242,254,0.04),transparent)]" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col items-center mb-14 text-center">
                        <div className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-1.5">
                            <span className="animate-pulse">🔥</span> Hot Marketplace Offers
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-foreground uppercase tracking-tighter mb-4">
                            Featured <span className="text-brand italic">Hot Deals</span>
                        </h2>
                        <p className="text-base md:text-lg text-foreground/70 max-w-2xl font-light">
                            Hand-inspected devices and verified hardware at unbeatable prices in Kenya Shillings.
                        </p>
                        <div className="w-16 h-1 bg-brand rounded-full mt-6"></div>
                    </div>

                    {isLoadingMarketplace ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="relative">
                                <div className="w-20 h-20 border-4 border-border-glass border-t-brand rounded-full animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center text-2xl">📱</div>
                            </div>
                        </div>
                    ) : categoryGroups && categoryGroups.length > 0 ? (
                        <div className="space-y-16 mb-16">
                            {categoryGroups.map((catGroup) => (
                                <div key={catGroup.key} className="space-y-6">
                                    {/* Category Line Header */}
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{catGroup.icon}</span>
                                            <h3 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tight">
                                                {catGroup.title}
                                            </h3>
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-brand/10 text-brand border border-brand/20">
                                                {catGroup.items.length} deals
                                            </span>
                                        </div>
                                        <Link 
                                            to="/marketplace" 
                                            className="text-xs font-bold uppercase tracking-wider text-brand hover:underline underline-offset-4 flex items-center gap-1"
                                        >
                                            View all <span className="text-sm">→</span>
                                        </Link>
                                    </div>

                                    {/* Single Scrollable Line for this Category */}
                                    <div className="flex gap-6 overflow-x-auto pb-6 pt-2 px-2 scrollbar-none snap-x snap-mandatory scroll-smooth -mx-2">
                                        {catGroup.items.map((listing: any) => (
                                            <div
                                                key={listing.id}
                                                onClick={() => handlePurchaseAttempt(listing.id)}
                                                className="min-w-[280px] sm:min-w-[320px] max-w-[320px] glass-card rounded-[2rem] overflow-hidden hover:shadow-2xl transition-all duration-500 group cursor-pointer border border-border-glass flex flex-col snap-start shrink-0 hover:border-brand/40"
                                            >
                                                <div className="h-56 bg-surface/50 relative overflow-hidden">
                                                    {listing.imageUrls && listing.imageUrls.length > 0 ? (
                                                        <img
                                                            src={listing.imageUrls[0]}
                                                            alt={listing.device}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface to-canvas">
                                                            <span className="text-6xl opacity-20">{catGroup.icon}</span>
                                                        </div>
                                                    )}

                                                    {/* Hot Deal Pill */}
                                                    <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                                                        <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/90 text-black shadow-md flex items-center gap-1 backdrop-blur-md">
                                                            <span>🔥</span> Hot Offer
                                                        </span>
                                                        <span className="px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-black/60 text-white backdrop-blur-md border border-white/10">
                                                            {listing.condition || 'Verified'}
                                                        </span>
                                                    </div>

                                                    {/* Stock badge */}
                                                    <div className="absolute bottom-3 left-4">
                                                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
                                                            {listing.piecesAvailable ? `${listing.piecesAvailable} left` : 'In Stock'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="p-6 flex-1 flex flex-col justify-between">
                                                    <div>
                                                        <h4 className="text-lg font-black text-foreground mb-1 line-clamp-1 group-hover:text-brand transition-colors">
                                                            {listing.device}
                                                        </h4>
                                                        <p className="text-[10px] text-brand font-black uppercase tracking-wider mb-2">
                                                            {listing.mainCategory} • {listing.subCategory}
                                                        </p>
                                                        <p className="text-foreground/60 text-xs line-clamp-2 leading-relaxed mb-4 font-light">
                                                            {listing.description || 'Certified tested device with guarantee.'}
                                                        </p>
                                                    </div>

                                                    <div className="pt-4 border-t border-border-glass flex justify-between items-center">
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] text-foreground/50 uppercase font-black tracking-widest">Price</span>
                                                            <span className="text-xl font-black text-foreground">
                                                                KES {Number(listing.price).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <button className="bg-foreground hover:bg-brand text-canvas hover:text-black w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow group-hover:translate-x-0.5">
                                                            <span className="text-base font-bold">→</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <div className="text-center pt-8">
                                <Link to="/marketplace">
                                    <button className="group relative bg-transparent text-foreground px-12 py-5 rounded-full uppercase tracking-widest text-xs font-black transition-all duration-500 border-2 border-foreground hover:border-brand hover:text-black overflow-hidden cursor-pointer">
                                        <span className="relative z-10">Explore All Marketplace Listings</span>
                                        <div className="absolute inset-0 bg-brand translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                    </button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-surface/50 rounded-[3rem] border-2 border-dashed border-border-glass">
                            <div className="text-7xl mb-6 opacity-20">📦</div>
                            <p className="text-xl font-black text-foreground/40 uppercase tracking-[0.3em]">No Current Hot Offers</p>
                            <p className="text-foreground/50 mt-4 font-light italic">Check back shortly for new device arrivals...</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="w-full bg-surface/30 py-32 border-t border-border-glass">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col items-center mb-24 text-center">
                        <div className="bg-brand/10 text-brand px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4">Operational Excellence</div>
                        <h2 className="text-4xl md:text-7xl font-black text-foreground uppercase tracking-tighter mb-4">
                            The <span className="text-brand italic">ElectroCare</span> Edge
                        </h2>
                        <div className="w-16 h-1 bg-brand rounded-full" />
                    </div>

                    {/* AI Diagnostic Section Integrated */}
                    <div className="mb-32">
                        <AIDiagnostic />
                    </div>
                </div>
            </section>

            <Footer />
            <RoleApplicationModal
                isOpen={isApplicationModalOpen}
                onClose={() => setIsApplicationModalOpen(false)}
                role={applicationRole}
            />
        </div>
    );
};

export { Landing };
