import React from 'react';

const ContactUs: React.FC = () => {
    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            <section className="glass-card rounded-[2.5rem] p-12 border border-white/10 shadow-premium relative overflow-hidden group text-center">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand/10 blur-[120px] -mr-48 -mt-48 transition-premium"></div>
                <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tighter">
                    Get in <span className="text-brand">Touch.</span>
                </h1>
                <p className="text-white/60 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                    Have questions or feedback? We'd love to hear from you.
                </p>
            </section>

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <form className="glass-card p-10 rounded-[2rem] border border-white/10 shadow-2xl space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Name</label>
                                <input type="text" className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-premium text-white placeholder:text-white/20" placeholder="Your Name" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Email</label>
                                <input type="email" className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-premium text-white placeholder:text-white/20" placeholder="your@email.com" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Message</label>
                            <textarea className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-premium text-white placeholder:text-white/20 h-40 resize-none" placeholder="How can we help?"></textarea>
                        </div>
                        <button type="submit" className="w-full premium-gradient text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-premium shadow-xl">
                            Send Message
                        </button>
                    </form>
                </div>

                <div className="space-y-6">
                    {[
                        { title: 'Email', value: 'support@electrocare.com', emoji: '📧' },
                        { title: 'Phone', value: '+254 700 000 000', emoji: '📱' },
                        { title: 'Address', value: 'Nairobi, Kenya', emoji: '📍' }
                    ].map((item, i) => (
                        <div key={i} className="glass-card p-6 rounded-2xl border border-white/5 hover:border-brand/30 transition-premium">
                            <div className="text-3xl mb-3">{item.emoji}</div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-1">{item.title}</h3>
                            <p className="text-white font-bold">{item.value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ContactUs;
