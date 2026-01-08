import React from 'react';

const AboutUs: React.FC = () => {
    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            <section className="glass-card rounded-[2.5rem] p-12 border border-white/10 shadow-premium relative overflow-hidden group text-center">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand/10 blur-[120px] -mr-48 -mt-48 transition-premium"></div>
                <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tighter">
                    About <span className="text-brand">ElectroCare.</span>
                </h1>
                <p className="text-white/60 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                    Kenya's premier platform for electronic device repairs and sustainable technology management.
                </p>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card p-10 rounded-[2rem] border border-white/5 shadow-lg">
                    <h2 className="text-2xl font-black text-white mb-6 tracking-widest uppercase">Our Mission</h2>
                    <p className="text-white/60 leading-relaxed mb-6">
                        We aim to reduce electronic waste by extending the life of your devices through quality repairs and a vibrant marketplace for used and refurbished electronics.
                    </p>
                    <p className="text-white/60 leading-relaxed">
                        By connecting users with certified technicians, we ensure transparency, reliability, and expert care for every device.
                    </p>
                </div>

                <div className="glass-card p-10 rounded-[2rem] border border-white/5 shadow-lg flex flex-col justify-center">
                    <h2 className="text-2xl font-black text-white mb-6 tracking-widest uppercase ml-4">Why Choose Us?</h2>
                    <ul className="space-y-4">
                        {[
                            { emoji: '👨‍🔧', text: 'Certified Technicians' },
                            { emoji: '💰', text: 'Transparent Pricing' },
                            { emoji: '🔒', text: 'Secure Payments' },
                            { emoji: '🚚', text: 'Convenient Pickup' }
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-4 glass-card p-4 rounded-xl border border-white/5 hover:border-brand/30 transition-premium">
                                <span className="text-2xl">{item.emoji}</span>
                                <span className="text-white font-bold tracking-tight">{item.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </div>
    );
};

export default AboutUs;
