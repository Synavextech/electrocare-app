import React, { useState } from 'react';
import ServiceInquiryModal, { ServiceInquiryType } from './ServiceInquiryModal';

const PROXIMITY_TOWNS = [
  'Eldoret',
  'Nairobi',
  'Nakuru',
  'Kisumu',
  'Mombasa',
  'Kitale',
  'Kericho',
  'Nyeri',
  'Naivasha',
  'Machakos',
  'Kakamega',
  'Thika',
  'Malindi',
  'Meru',
  'Embu',
  'Bungoma',
  'Kapsabet',
  'Iten',
];

export const SoftwareAndCustomAppsSection: React.FC = () => {
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalServiceType, setModalServiceType] = useState<ServiceInquiryType>('software_custom_app');
  const [modalLocationTown, setModalLocationTown] = useState('');
  const [modalQuotationKes, setModalQuotationKes] = useState<number | undefined>(undefined);
  const [modalPlanTitle, setModalPlanTitle] = useState('');

  // Satellite interactive widget states
  const [searchTown, setSearchTown] = useState('Eldoret');
  const [checkedTown, setCheckedTown] = useState<string | null>('Eldoret');
  const [satelliteTier, setSatelliteTier] = useState<'standard' | 'enterprise'>('standard');

  const handleOpenModal = (
    type: ServiceInquiryType,
    town: string = '',
    quotation?: number,
    planTitle: string = ''
  ) => {
    setModalServiceType(type);
    setModalLocationTown(town || searchTown);
    setModalQuotationKes(quotation);
    setModalPlanTitle(planTitle);
    setIsModalOpen(true);
  };

  const handleCheckLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTown.trim()) {
      setCheckedTown(searchTown.trim());
    }
  };

  // Quotation calculations
  const hardwareKit = 39000;
  const mountingAndCabling = 5000;
  const activationFee = 2500;
  const monthlySubscription = satelliteTier === 'standard' ? 4500 : 8500;
  const totalInitialCost = hardwareKit + mountingAndCabling + activationFee + monthlySubscription;

  return (
    <section className="py-24 bg-surface/40 border-t border-b border-border-glass relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-brand/5 blur-[160px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 space-y-20">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-brand/10 text-brand border border-brand/20">
            <span>⚡</span> Digital Infrastructure & High-Speed Networks
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-foreground uppercase tracking-tighter">
            Software, AI & <span className="text-brand">Custom Applications</span>
          </h2>
          <p className="text-foreground/70 text-sm md:text-base font-light leading-relaxed">
            From bespoke full-stack applications and private enterprise AI models to turnkey ISP operations,
            unthrottled Electron broadband, and satellite internet anywhere in Kenya.
          </p>
        </div>

        {/* 3 Core Solution Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Software and Custom Application */}
          <div className="glass-card rounded-[2rem] p-8 border border-border-glass hover:border-brand/40 transition-all duration-500 flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center text-3xl mb-6 shadow-inner group-hover:scale-110 transition-transform">
                💻
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-brand bg-brand/5 px-3 py-1 rounded-full border border-brand/10">
                Custom Engineering
              </span>
              <h3 className="text-2xl font-black text-foreground uppercase tracking-tight mt-3 mb-2">
                Software & Custom Apps
              </h3>
              <p className="text-foreground/70 text-xs md:text-sm font-light leading-relaxed mb-6">
                Bespoke web applications, cross-platform iOS & Android mobile apps, business ERPs, POS software,
                and scalable cloud APIs designed for high reliability.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-8">
                {['Web Apps', 'Mobile iOS/Android', 'Cloud ERP', 'Custom APIs'].map((tag, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-surface border border-border-glass text-foreground/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleOpenModal('software_custom_app')}
              className="w-full py-4 rounded-xl bg-foreground hover:bg-brand text-canvas hover:text-black font-black uppercase tracking-widest text-xs transition-all duration-300 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <span>✨</span> Send Request
            </button>
          </div>

          {/* Card 2: AI Configuration for Business, Home or Institution */}
          <div className="glass-card rounded-[2rem] p-8 border border-border-glass hover:border-brand/40 transition-all duration-500 flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center text-3xl mb-6 shadow-inner group-hover:scale-110 transition-transform">
                🧠
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-brand bg-brand/5 px-3 py-1 rounded-full border border-brand/10">
                Intelligent Systems
              </span>
              <h3 className="text-2xl font-black text-foreground uppercase tracking-tight mt-3 mb-2">
                AI Configuration
              </h3>
              <p className="text-foreground/70 text-xs md:text-sm font-light leading-relaxed mb-6">
                Deploy private on-premises LLMs, automated customer support chatbots, smart home & building
                automations, and computer vision for intelligent CCTV surveillance.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-8">
                {['Local LLMs', 'CCTV Vision AI', 'WhatsApp Bots', 'Smart Home IoT'].map((tag, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-surface border border-border-glass text-foreground/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleOpenModal('ai_configuration')}
              className="w-full py-4 rounded-xl bg-foreground hover:bg-brand text-canvas hover:text-black font-black uppercase tracking-widest text-xs transition-all duration-300 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <span>🤖</span> Configure AI / Send Request
            </button>
          </div>

          {/* Card 3: ISP Management System */}
          <div className="glass-card rounded-[2rem] p-8 border border-border-glass hover:border-brand/40 transition-all duration-500 flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center text-3xl mb-6 shadow-inner group-hover:scale-110 transition-transform">
                📡
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-brand bg-brand/5 px-3 py-1 rounded-full border border-brand/10">
                Turn-Key ISP Operations
              </span>
              <h3 className="text-2xl font-black text-foreground uppercase tracking-tight mt-3 mb-2">
                ISP Management System
              </h3>
              <p className="text-foreground/70 text-xs md:text-sm font-light leading-relaxed mb-6">
                Complete billing and network management for internet providers. Seamless MikroTik RouterOS
                integration, automated Lipa na M-Pesa STK push, Wi-Fi vouchers, and client portal.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-8">
                {['MikroTik Sync', 'M-Pesa STK Billing', 'Voucher Generator', 'Bandwidth Control'].map((tag, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-surface border border-border-glass text-foreground/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleOpenModal('isp_management')}
              className="w-full py-4 rounded-xl bg-foreground hover:bg-brand text-canvas hover:text-black font-black uppercase tracking-widest text-xs transition-all duration-300 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <span>🚀</span> Deploy ISP System / Demo
            </button>
          </div>
        </div>

        {/* Feature 4: Electron Network - Unlimited Internet Access Spotlight */}
        <div className="glass-card rounded-[2.5rem] p-8 md:p-12 border border-brand/30 relative overflow-hidden bg-gradient-to-br from-brand/5 via-surface to-surface">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand/10 blur-[100px] -mr-40 -mt-40 pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="max-w-2xl space-y-4">
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.25em] text-brand bg-brand/10 px-4 py-1.5 rounded-full border border-brand/20">
                High-Speed Broadband Infrastructure
              </span>
              <h3 className="text-3xl md:text-5xl font-black text-foreground uppercase tracking-tight leading-tight">
                Get Connected to <span className="text-brand">Electron Network</span>
              </h3>
              <p className="text-foreground/70 text-sm md:text-base font-light leading-relaxed">
                Unlimited, uncapped internet access for <span className="text-foreground font-semibold">homes</span>,{' '}
                <span className="text-foreground font-semibold">offices</span>, and{' '}
                <span className="text-foreground font-semibold">institutions</span>. Experience low latency, zero
                throttling, and 99.9% uptime backed by ElectroCare field support.
              </p>

              {/* Tier preview pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {[
                  { speed: '15 Mbps', name: 'Home Unlimited', price: 'KES 2,499 / mo' },
                  { speed: '30 Mbps', name: 'Office Turbo', price: 'KES 3,999 / mo' },
                  { speed: '60 Mbps', name: 'Campus Ultra', price: 'KES 5,999 / mo' },
                ].map((tier, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-surface/80 border border-border-glass">
                    <span className="text-xs font-bold text-foreground/60">{tier.name}</span>
                    <p className="text-xl font-black text-foreground">{tier.speed}</p>
                    <p className="text-brand font-black text-xs mt-1">{tier.price}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct Access CTA Button */}
            <div className="w-full lg:w-auto shrink-0 flex flex-col items-center gap-3">
              <button
                onClick={() => handleOpenModal('electron_network')}
                className="w-full sm:w-auto px-10 py-5 rounded-full bg-brand text-black font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(0,242,254,0.35)] flex items-center justify-center gap-3 cursor-pointer"
              >
                <span>⚡</span> Get Connected to Electron Network
              </button>
              <span className="text-[11px] text-foreground/50 tracking-wider">
                Instant application • Client details & address location verified live
              </span>
            </div>
          </div>
        </div>

        {/* Feature 5: Satellite-Based Internet Connection Showcase */}
        <div className="glass-card rounded-[2.5rem] p-8 md:p-12 border border-border-glass relative overflow-hidden space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border-glass">
            <div className="space-y-3 max-w-2xl">
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400 bg-cyan-400/10 px-4 py-1.5 rounded-full border border-cyan-400/20">
                Satellite Broadband Constellation
              </span>
              <h3 className="text-3xl md:text-5xl font-black text-foreground uppercase tracking-tight">
                Satellite Internet <span className="text-cyan-400">Anywhere in Kenya</span>
              </h3>
              <p className="text-foreground/70 text-xs md:text-sm font-light leading-relaxed">
                Connect your remote ranch, school, institution, or urban estate to low-latency satellite internet.
                Complete high-performance dish kit, professional precision alignment, and seamless unlimited data.
              </p>
            </div>

            {/* Satellite Tier Toggle */}
            <div className="flex items-center gap-2 p-1.5 bg-surface border border-border-glass rounded-full self-start md:self-auto">
              <button
                type="button"
                onClick={() => setSatelliteTier('standard')}
                className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                  satelliteTier === 'standard' ? 'bg-cyan-400 text-black shadow-md' : 'text-foreground/70 hover:text-foreground'
                }`}
              >
                Standard (100 Mbps)
              </button>
              <button
                type="button"
                onClick={() => setSatelliteTier('enterprise')}
                className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                  satelliteTier === 'enterprise' ? 'bg-cyan-400 text-black shadow-md' : 'text-foreground/70 hover:text-foreground'
                }`}
              >
                Priority (250 Mbps)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Tool 1: Check Availability in My Location */}
            <div className="p-6 md:p-8 rounded-[2rem] bg-surface/50 border border-border-glass flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2 text-cyan-400">
                  <span className="text-xl">📍</span>
                  <h4 className="font-black text-lg text-foreground uppercase tracking-tight">
                    Check Availability in My Location
                  </h4>
                </div>
                <p className="text-foreground/60 text-xs font-light mb-4">
                  Default availability enabled for all towns and regions within proximity of ElectroCare service
                  centers and field engineering sites across East Africa.
                </p>

                <form onSubmit={handleCheckLocation} className="flex gap-2">
                  <input
                    type="text"
                    value={searchTown}
                    onChange={(e) => setSearchTown(e.target.value)}
                    placeholder="Enter your town or county (e.g. Eldoret, Nakuru)"
                    className="flex-1 px-4 py-3 rounded-xl bg-surface border border-border-glass text-xs text-foreground focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-cyan-400 text-black font-black uppercase tracking-wider text-xs hover:opacity-90 transition-opacity cursor-pointer shrink-0"
                  >
                    Check
                  </button>
                </form>

                {/* Popular Proximity Quick-Select Towns */}
                <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-foreground/40 uppercase font-black tracking-wider">Quick towns:</span>
                  {PROXIMITY_TOWNS.slice(0, 6).map((town) => (
                    <button
                      key={town}
                      type="button"
                      onClick={() => {
                        setSearchTown(town);
                        setCheckedTown(town);
                      }}
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all ${
                        checkedTown?.toLowerCase() === town.toLowerCase()
                          ? 'bg-cyan-400/20 text-cyan-400 border-cyan-400/40'
                          : 'bg-surface border-border-glass text-foreground/60 hover:text-foreground'
                      }`}
                    >
                      {town}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability Verified Banner */}
              {checkedTown && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wide">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                    Satellite & Field Coverage Active in {checkedTown}
                  </div>
                  <p className="text-[11px] text-foreground/70 leading-relaxed font-light">
                    Direct line-of-sight satellite constellation confirmed. Official ElectroCare installation vans
                    operate active routes covering{' '}
                    <span className="font-semibold text-foreground">{checkedTown}</span> and surrounding areas with
                    same-week equipment delivery and mounting.
                  </p>
                </div>
              )}
            </div>

            {/* Tool 2: See Quotation & Apply */}
            <div className="p-6 md:p-8 rounded-[2rem] bg-surface/50 border border-border-glass flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <span className="text-xl">🧾</span>
                    <h4 className="font-black text-lg text-foreground uppercase tracking-tight">
                      See Transparent Quotation
                    </h4>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    Guaranteed Rate
                  </span>
                </div>
                <p className="text-foreground/60 text-xs font-light mb-4">
                  Transparent breakdown for complete kit hardware, professional roof/wall mounting, and monthly
                  unlimited broadband.
                </p>

                {/* Quotation Line Items */}
                <div className="space-y-2 text-xs divide-y divide-border-glass">
                  <div className="flex justify-between py-1.5 text-foreground/70">
                    <span>High-Performance Satellite Dish & Wi-Fi 6 Router</span>
                    <span className="font-bold text-foreground">KES {hardwareKit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-foreground/70">
                    <span>Precision Mounting, Grounding & Cabling Kit</span>
                    <span className="font-bold text-foreground">KES {mountingAndCabling.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-foreground/70">
                    <span>Certified ElectroCare Tech Activation</span>
                    <span className="font-bold text-foreground">KES {activationFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-foreground/70">
                    <span>
                      First Month Unlimited Data ({satelliteTier === 'standard' ? 'Standard 100 Mbps' : 'Priority 250 Mbps'})
                    </span>
                    <span className="font-bold text-cyan-400">KES {monthlySubscription.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-3 font-black text-sm text-foreground">
                    <span className="uppercase tracking-wider">Total Initial Deployment</span>
                    <span className="text-emerald-400 text-base">KES {totalInitialCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Button: Apply for Satellite Connection */}
              <button
                onClick={() =>
                  handleOpenModal(
                    'satellite_internet',
                    checkedTown || searchTown,
                    totalInitialCost,
                    `Satellite ${satelliteTier === 'standard' ? 'Standard 100 Mbps' : 'Priority 250 Mbps'} (Total KES ${totalInitialCost.toLocaleString()})`
                  )
                }
                className="w-full py-4 rounded-xl bg-cyan-400 text-black font-black uppercase tracking-widest text-xs hover:opacity-90 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🛰️</span> Apply for Satellite Connection in {checkedTown || searchTown}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reusable Interactive Modal */}
      <ServiceInquiryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialServiceType={modalServiceType}
        initialLocationTown={modalLocationTown}
        initialQuotationKes={modalQuotationKes}
        initialPlanTitle={modalPlanTitle}
      />
    </section>
  );
};

export default SoftwareAndCustomAppsSection;
