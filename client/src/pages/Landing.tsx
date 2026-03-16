import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import Footer from '../components/Footer';
import useAuth from '../hooks/useAuth';
import apiClient from '../utils/apiClient';
import AIDiagnostic from '../components/AIDiagnostic';

const Landing = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Fetch marketplace listings
    const { data: marketplaceListings, isLoading: isLoadingMarketplace } = useQuery({
        queryKey: ['marketplace-preview'],
        queryFn: async () => {
            const res = await apiClient.get('/marketplace');
            const data = Array.isArray(res.data) ? res.data : [];
            return data.slice(0, 6);
        },
        staleTime: 60000, // Cache for 1 minute
    });

    const handlePurchaseAttempt = () => {
        if (!user) {
            navigate({ to: '/login' });
        } else {
            navigate({ to: '/marketplace' });
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
            {/* Hero Section */}
            <section className="relative min-h-screen w-full overflow-hidden flex flex-col">
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
                            🚀 AI-Powered Diagonostics Live
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
                                {user ? 'View Dashboard' : 'Launch App'}
                            </span>
                        </Link>
                        <Link to="/schedule">
                            <span className="cursor-pointer bg-transparent hover:bg-white/10 text-white px-12 py-5 rounded-full uppercase tracking-widest text-sm font-black transition-all duration-500 border-2 border-white/30 backdrop-blur-md block">
                                Repair Now
                            </span>
                        </Link>
                    </div>
                </div>

                {/* Operational Services Integration in Hero */}
                <div className="relative z-10 w-full bg-gradient-to-t from-black/90 to-transparent pt-20 pb-10">
                    <div className="container mx-auto px-4">
                        <div className="grid md:grid-cols-4 gap-6">
                            {[
                                { title: 'AI Repair', icon: '🧠', desc: 'Self-diagnostic AI for instant checks.', link: '/schedule' },
                                { title: 'Laptops', icon: '💻', desc: 'Motherboard & component specialists.', link: '/schedule' },
                                { title: 'Marketplace', icon: '🛒', desc: 'Buy & sell verified tech assets.', link: '/marketplace' },
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

            {/* Marketplace Preview Section */}
            <section className="w-full bg-white py-24 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.03),transparent)]" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col items-center mb-16 text-center">
                        <div className="bg-primary/10 text-primary px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4">Certified Pre-Owned</div>
                        <h2 className="text-4xl md:text-7xl font-black text-gray-900 uppercase tracking-tighter mb-4">
                            Global <span className="text-primary italic">Tech</span> Market
                        </h2>
                        <p className="text-lg text-gray-500 max-w-2xl mb-8 font-light">
                            Premium laptops and smartphones, rigorously tested and certified by our expert technicians.
                        </p>
                        <div className="w-16 h-1 bg-primary rounded-full mb-12"></div>
                    </div>

                    {isLoadingMarketplace ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="relative">
                                <div className="w-24 h-24 border-4 border-gray-100 border-t-primary rounded-full animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center text-2xl">📱</div>
                            </div>
                        </div>
                    ) : marketplaceListings && marketplaceListings.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-16">
                                {marketplaceListings.map((listing: any) => (
                                    <div
                                        key={listing.id}
                                        className="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgba(34,197,94,0.12)] transition-all duration-700 group cursor-pointer border border-gray-100 flex flex-col"
                                        onClick={() => handlePurchaseAttempt()}
                                    >
                                        <div className="h-72 bg-gray-50 relative overflow-hidden">
                                            {listing.imageUrls && listing.imageUrls.length > 0 ? (
                                                <img
                                                    src={listing.imageUrls[0]}
                                                    alt={listing.device}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                                                    <span className="text-7xl opacity-10">TECH</span>
                                                </div>
                                            )}
                                            <div className="absolute top-6 left-6 flex flex-col gap-2">
                                                <div className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm border border-white/50">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                                                        {listing.condition}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-10 flex-1 flex flex-col">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-2xl font-black text-gray-900 mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                                                        {listing.device}
                                                    </h3>
                                                    <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em]">
                                                        {listing.mainCategory} • {listing.subCategory}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-gray-500 text-sm mb-8 line-clamp-2 font-light leading-relaxed">
                                                {listing.description}
                                            </p>
                                            <div className="mt-auto pt-6 border-t border-gray-50 flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-400 uppercase font-bold tracking-widest">Price</span>
                                                    <span className="text-3xl font-black text-gray-900">
                                                        ${listing.price}
                                                    </span>
                                                </div>
                                                <button className="bg-gray-900 hover:bg-primary text-white w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg hover:shadow-primary/40 group-hover:translate-y-[-4px]">
                                                    <span className="text-xl">→</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="text-center">
                                <Link to="/marketplace">
                                    <button className="group relative bg-white text-gray-900 px-14 py-6 rounded-full uppercase tracking-widest text-xs font-black transition-all duration-500 border-2 border-gray-900 hover:border-primary hover:text-white overflow-hidden">
                                        <span className="relative z-10">Visit Full Marketplace</span>
                                        <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                    </button>
                                </Link>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                            <div className="text-7xl mb-6 opacity-20">📦</div>
                            <p className="text-xl font-black text-gray-300 uppercase tracking-[0.3em]">Marketplace Empty</p>
                            <p className="text-gray-400 mt-4 font-light italic">Authenticating new listings...</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="w-full bg-gray-50 py-32">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col items-center mb-24 text-center">
                        <div className="bg-primary/10 text-primary px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4">Operational Excellence</div>
                        <h2 className="text-4xl md:text-7xl font-black text-gray-900 uppercase tracking-tighter mb-4">
                            The <span className="text-primary italic">ElectroCare</span> Edge
                        </h2>
                        <div className="w-16 h-1 bg-primary rounded-full" />
                    </div>

                    {/* AI Diagnostic Section Integrated */}
                    <div className="mb-32">
                        <AIDiagnostic />
                    </div>

                    <div className="grid gap-32">
                        {[
    {
                                title: "AI-Native Diagnostics",
                                subtitle: "Zero-Latency Error Detection",
                                desc: "Our proprietary AI engine runs deep-level hardware and software diagnostics in milliseconds, identifying hidden circuit failures that human eyes miss. Precision is our baseline.",
                                img: "/images/autorepair.gif",
                                tags: ["Self-Diag", "Circuit Scan", "OS Opt"]
                            },
                            {
                                title: "Sustainable Tech Lifecycle",
                                subtitle: "End-to-End Asset Management",
                                desc: "We provide a circular economy for electronics. From elite repairs to ethical recycling, we ensure your tech never ends up in a landfill. Dead devices are harvested for points or cash.",
                                img: "/images/sell1.gif",
                                tags: ["Recycle", "Cash-Back", "Verified"]
                            },
                            {
                                title: "Smart Logistics Network",
                                subtitle: "Real-Time Tracking & Fulfillment",
                                desc: "Connected to a fleet of real-time and scheduled riders, your device never spends a minute more than necessary in transit. End-to-end encryption for every delivery.",
                                img: "/images/delivery.gif",
                                tags: ["Live Track", "Secure Box", "Insured"]
                            }
                        ].map((item, i) => (
                            <div key={i} className={`flex flex-col md:flex-row items-center gap-20 ${i % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                                <div className="flex-1 space-y-8">
                                    <div className="space-y-2">
                                        <span className="text-primary font-black tracking-[0.2em] uppercase text-[10px]">{item.subtitle}</span>
                                        <h3 className="text-4xl md:text-6xl font-black text-gray-900 leading-[0.9] uppercase tracking-tighter">{item.title}</h3>
                                    </div>
                                    <p className="text-lg text-gray-500 leading-relaxed font-light">{item.desc}</p>
                                    <div className="flex flex-wrap gap-3">
                                        {item.tags.map((tag, t) => (
                                            <span key={t} className="bg-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase text-gray-400 border border-gray-200">#{tag}</span>
                                        ))}
                                    </div>
                                    <div className="pt-6">
                                        <button className="group flex items-center gap-4 font-black uppercase tracking-widest text-xs py-2">
                                            Explore Innovation 
                                            <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:translate-x-2">→</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 w-full h-[500px] rounded-[3rem] overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.1)] group relative">
                                    <img
                                        src={item.img}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            {/* About Services Grid */}
            <section className="py-24 bg-gray-50">
                <div className="container mx-auto px-4 text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter mb-4">Our <span className="text-primary">Service Delivery</span></h2>
                    <p className="text-gray-500 max-w-2xl mx-auto">We offer comprehensive solutions for all your electronic needs, from AI-powered repairs to a seamless marketplace.</p>
                </div>

                <div className="container mx-auto px-4 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        {
                            title: "Mobile Solutions",
                            desc: "Repair models, buy new, upgrade, or sell old phones.",
                            icon: "📱",
                            img: "/images/repairpro.gif",
                            actions: ["Repair", "Buy", "Sell", "Swap"]
                        },
                        {
                            title: "Laptop Hub",
                            desc: "Pro laptop repairs, new arrivals, and trade-in options.",
                            icon: "💻",
                            img: "/images/fixit.gif",
                            actions: ["Repair", "Buy", "Sell", "Swap"]
                        },
                        {
                            title: "Tech Marketplace",
                            desc: "Secure platform to buy new and sell used electronics.",
                            icon: "🌐",
                            img: "/images/check_out.gif",
                            actions: ["Listed", "Secure", "Verified", "Facilitated"]
                        }
                    ].map((service, i) => (
                        <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 flex flex-col group">
                            <div className="h-48 overflow-hidden relative">
                                <img src={service.img} alt={service.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-lg shadow-sm">
                                    {service.icon}
                                </div>
                            </div>
                            <div className="p-8 flex-1 flex flex-col">
                                <h3 className="text-xl font-bold mb-3 text-gray-900 uppercase tracking-tight">{service.title}</h3>
                                <p className="text-gray-600 text-sm mb-6 flex-1">{service.desc}</p>
                                <div className="flex flex-wrap gap-2">
                                    {service.actions.map((action, j) => (
                                        <span key={j} className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-gray-100 rounded-full text-gray-500">
                                            {action}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <Footer />
        </div>
    );
};

export { Landing };
