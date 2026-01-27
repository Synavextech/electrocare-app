import { Link } from '@tanstack/react-router';
import Footer from '../components/Footer';
import useAuth from '../hooks/useAuth';

const Landing = () => {
    const { user } = useAuth();
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
                    <div className="absolute inset-0 bg-black/50" />
                </div>

                <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center text-white px-4 pt-20">
                    <h1 className="text-5xl md:text-8xl font-bold tracking-tighter mb-6 uppercase drop-shadow-2xl">
                        ElectroCare<span className="text-primary">.TECH</span>
                    </h1>
                    <p className="text-xl md:text-3xl font-light tracking-wide max-w-3xl mx-auto mb-12 drop-shadow-lg opacity-90">
                        Precision. Reliability. Excellence.
                    </p>
                    <Link to={user ? "/home" : "/login"}>
                        <span className="cursor-pointer bg-primary hover:bg-white hover:text-primary text-white px-12 py-5 rounded-full uppercase tracking-widest text-sm font-bold transition-all duration-500 border-2 border-primary shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                            {user ? 'Go to Home Dashboard' : 'Get Started Now'}
                        </span>
                    </Link>
                </div>

                {/* Operational Services Integration in Hero */}
                <div className="relative z-10 w-full bg-gradient-to-t from-black/80 to-transparent pt-20 pb-10">
                    <div className="container mx-auto px-4">
                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { title: 'Repairs', icon: '🛠️', desc: 'AI-aided precision repairs for all devices.', link: '/schedule' },
                                { title: 'Marketplace', icon: '🛒', desc: 'Buy, sell, or swap devices with ease.', link: '/marketplace' },
                                { title: 'Recycling', icon: '♻️', desc: 'Securely sell your old or dead devices.', link: '/marketplace?tab=sell' }
                            ].map((service, i) => (
                                <Link key={i} to={service.link}>
                                    <div className="group p-8 backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl hover:bg-primary/20 hover:border-primary transition-all duration-500 cursor-pointer h-full">
                                        <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-500">{service.icon}</div>
                                        <h3 className="text-xl font-bold mb-2 text-white uppercase tracking-wider">{service.title}</h3>
                                        <p className="text-white/70 font-light leading-relaxed">{service.desc}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="w-full bg-white py-24 border-y border-gray-100">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col items-center mb-20 text-center">
                        <h2 className="text-4xl md:text-6xl font-black text-gray-900 uppercase tracking-tighter mb-4">
                            Why Choose <span className="text-primary">ElectroCare?</span>
                        </h2>
                        <div className="w-24 h-2 bg-primary rounded-full" />
                    </div>

                    <div className="grid gap-24">
                        {[
                            {
                                title: "AI-Aided Excellence",
                                subtitle: "Precision in every repair",
                                desc: "Our technicians leverage AI-aided diagnostics and repair tools to ensure your device is fixed with unmatched precision and speed.",
                                img: "/images/autorepair.gif"
                            },
                            {
                                title: "Secure Marketplace",
                                subtitle: "Buy. Sell. Swap. Swap.",
                                desc: "Easily reach new users or upgrade your tech. We facilitate secure transactions and verified listings for your peace of mind.",
                                img: "/images/sell1.gif",
                            },
                            {
                                title: "Doorstep Delivery",
                                subtitle: "We facilitate the delivery",
                                desc: "No need to leave your home. We handle the logistics, providing doorstep pickup and delivery for all your repair and marketplace needs.",
                                img: "/images/delivery.gif",
                            }
                        ].map((item, i) => (
                            <div key={i} className={`flex flex-col md:flex-row items-center gap-12 ${i % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                                <div className="flex-1 space-y-6">
                                    <span className="text-primary font-bold tracking-widest uppercase text-sm">{item.subtitle}</span>
                                    <h3 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">{item.title}</h3>
                                    <p className="text-lg text-gray-600 leading-relaxed font-light">{item.desc}</p>
                                    <div className="pt-4">
                                        <button className="flex items-center gap-2 font-bold uppercase tracking-widest text-sm hover:text-primary transition-colors">
                                            Learn More <span className="text-xl">→</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 w-full h-[400px] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] group">
                                    <img
                                        src={item.img}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
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

                <div className="container mx-auto px-4 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
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
                            title: "Home Appliances",
                            desc: "Expert restoration for all your essential home tech.",
                            icon: "🏠",
                            img: "/images/drfix.gif",
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
