import React, { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import useAuth from '../hooks/useAuth';

export type ServiceInquiryType =
  | 'software_custom_app'
  | 'ai_configuration'
  | 'isp_management'
  | 'electron_network'
  | 'satellite_internet';

interface ServiceInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialServiceType?: ServiceInquiryType;
  initialLocationTown?: string;
  initialQuotationKes?: number;
  initialPlanTitle?: string;
}

const SERVICE_TYPE_CONFIG: Record<
  ServiceInquiryType,
  { title: string; subtitle: string; icon: string; badge: string }
> = {
  software_custom_app: {
    title: 'Custom Software & Applications',
    subtitle: 'Request bespoke web, mobile, enterprise ERP, and cloud applications designed for your business.',
    icon: '💻',
    badge: 'Custom Engineering',
  },
  ai_configuration: {
    title: 'AI System Configuration',
    subtitle: 'Deploy custom AI agents, local private LLMs, smart home automation, and computer vision.',
    icon: '🧠',
    badge: 'Intelligent Systems',
  },
  isp_management: {
    title: 'ISP Management & Billing Suite',
    subtitle: 'Automate your MikroTik network, Lipa na M-Pesa STK billing, hotspot vouchers, and PPPoE subscribers.',
    icon: '📡',
    badge: 'Turn-Key ISP Ops',
  },
  electron_network: {
    title: 'Connect to Electron Network',
    subtitle: 'High-speed unlimited fiber & wireless internet access for homes, offices, and institutions.',
    icon: '⚡',
    badge: 'Unlimited Broadband',
  },
  satellite_internet: {
    title: 'Satellite Broadband Connection',
    subtitle: 'Order high-performance satellite dish kits & reliable broadband for urban and remote locations.',
    icon: '🛰️',
    badge: 'Satellite Broadband',
  },
};

export const ServiceInquiryModal: React.FC<ServiceInquiryModalProps> = ({
  isOpen,
  onClose,
  initialServiceType = 'software_custom_app',
  initialLocationTown = '',
  initialQuotationKes,
  initialPlanTitle = '',
}) => {
  const { user } = useAuth();

  const [serviceType, setServiceType] = useState<ServiceInquiryType>(initialServiceType);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [targetEntity, setTargetEntity] = useState<'home' | 'office' | 'institution' | 'business' | 'enterprise'>('business');
  const [locationTown, setLocationTown] = useState(initialLocationTown);
  const [locationAddress, setLocationAddress] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [budget, setBudget] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Detailed fields
  const [softwarePlatform, setSoftwarePlatform] = useState('Web & Mobile App');
  const [aiScope, setAiScope] = useState('Business Automation & Customer Support');
  const [ispClients, setIspClients] = useState('100 - 500 Subscribers');
  const [electronPlan, setElectronPlan] = useState('Turbo 30 Mbps (KES 3,999/mo)');
  const [satelliteKitSelected, setSatelliteKitSelected] = useState('Standard High-Speed Dish Kit');

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync initial state when modal opens
  useEffect(() => {
    if (isOpen) {
      setServiceType(initialServiceType);
      if (initialLocationTown) setLocationTown(initialLocationTown);
      if (initialQuotationKes) setBudget(String(initialQuotationKes));
      if (initialPlanTitle) {
        if (initialServiceType === 'electron_network') setElectronPlan(initialPlanTitle);
        if (initialServiceType === 'satellite_internet') setSatelliteKitSelected(initialPlanTitle);
      }
      if (user) {
        setClientName(user.name || '');
        setClientEmail(user.email || '');
        if (user.phone) setClientPhone(user.phone);
      }
      setSubmitSuccess(null);
      setErrorMsg(null);
    }
  }, [isOpen, initialServiceType, initialLocationTown, initialQuotationKes, initialPlanTitle, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!clientName.trim() || !clientEmail.trim() || !clientPhone.trim()) {
      setErrorMsg('Please provide your full name, email address, and phone number.');
      return;
    }

    if (!locationTown.trim()) {
      setErrorMsg('Please specify your town / locality.');
      return;
    }

    setSubmitting(true);

    try {
      const detailsPayload: Record<string, any> = {
        softwarePlatform: serviceType === 'software_custom_app' ? softwarePlatform : undefined,
        aiScope: serviceType === 'ai_configuration' ? aiScope : undefined,
        ispClients: serviceType === 'isp_management' ? ispClients : undefined,
        electronPlan: serviceType === 'electron_network' ? electronPlan : undefined,
        satelliteKitSelected: serviceType === 'satellite_internet' ? satelliteKitSelected : undefined,
      };

      const payload = {
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim().toLowerCase(),
        clientPhone: clientPhone.trim(),
        serviceType,
        targetEntity,
        locationTown: locationTown.trim(),
        locationAddress: locationAddress.trim() || undefined,
        urgency,
        budget: budget && Number(budget) > 0 ? Number(budget) : undefined,
        quotationKes: initialQuotationKes || (budget && Number(budget) > 0 ? Number(budget) : undefined),
        details: detailsPayload,
        notes: notes.trim() || undefined,
      };

      const res = await apiClient.post('/service-inquiries', payload);
      setSubmitSuccess(res.data?.inquiry || { id: 'CONFIRMED' });
    } catch (err: any) {
      console.error('Submission failed', err);
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentConfig = SERVICE_TYPE_CONFIG[serviceType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-surface border border-border-glass rounded-[2.5rem] shadow-2xl overflow-hidden my-8">
        {/* Header Ribbon */}
        <div className="p-6 md:p-8 border-b border-border-glass bg-gradient-to-r from-brand/10 via-brand/5 to-transparent relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-surface border border-border-glass flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-white/10 transition-colors"
          >
            ✕
          </button>

          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{currentConfig.icon}</span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-brand bg-brand/10 px-3 py-1 rounded-full border border-brand/20">
                {currentConfig.badge}
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-foreground uppercase tracking-tight mt-1">
                {currentConfig.title}
              </h2>
            </div>
          </div>
          <p className="text-foreground/70 text-xs md:text-sm font-light leading-relaxed">
            {currentConfig.subtitle}
          </p>
        </div>

        {submitSuccess ? (
          <div className="p-8 md:p-12 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-4xl mx-auto animate-bounce">
              ✓
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">
                Request Dispatched Successfully!
              </h3>
              <p className="text-foreground/70 text-sm max-w-md mx-auto leading-relaxed">
                Thank you, <span className="font-bold text-foreground">{clientName}</span>. Your request has been logged under reference{' '}
                <span className="font-mono text-brand font-bold">
                  #{submitSuccess.id ? String(submitSuccess.id).slice(0, 8).toUpperCase() : 'REQ-LIVE'}
                </span>
                . Our engineering and network support team in <span className="text-foreground font-semibold">{locationTown || 'your area'}</span> will review your details and reach out within 2 hours.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface/50 border border-border-glass max-w-md mx-auto text-left text-xs space-y-1">
              <p className="text-foreground/50 uppercase tracking-widest font-bold text-[10px]">Contact Registered</p>
              <p className="font-semibold text-foreground">Phone: {clientPhone}</p>
              <p className="font-semibold text-foreground">Email: {clientEmail}</p>
              {budget && Number(budget) > 0 && (
                <p className="text-emerald-400 font-bold">Budget / Estimated KES: {Number(budget).toLocaleString()}</p>
              )}
            </div>

            <button
              onClick={onClose}
              className="px-8 py-3.5 rounded-full bg-brand text-black font-black uppercase tracking-widest text-xs hover:opacity-90 transition-opacity"
            >
              Done & Return
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Service Type Switcher Tabs */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-2">
                Select Service Focus
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {(Object.keys(SERVICE_TYPE_CONFIG) as ServiceInquiryType[]).map((type) => {
                  const cfg = SERVICE_TYPE_CONFIG[type];
                  const isSelected = serviceType === type;
                  return (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setServiceType(type)}
                      className={`p-2.5 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-brand/10 border-brand text-foreground shadow-md'
                          : 'bg-surface border-border-glass text-foreground/60 hover:text-foreground hover:bg-surface/80'
                      }`}
                    >
                      <span className="text-lg mb-1">{cfg.icon}</span>
                      <span className="text-[10px] font-bold leading-tight line-clamp-1">{cfg.badge}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Client Details Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-foreground/60 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Kelvin Kiprono"
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-glass text-sm text-foreground focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-foreground/60 mb-1">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="0712 345 678"
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-glass text-sm text-foreground focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-foreground/60 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="kelvin@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-glass text-sm text-foreground focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            {/* Target Entity, Location & Urgency */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-foreground/60 mb-1">
                  Deployment For
                </label>
                <select
                  value={targetEntity}
                  onChange={(e: any) => setTargetEntity(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border-glass text-sm text-foreground focus:outline-none focus:border-brand"
                >
                  <option value="home">Home / Residential</option>
                  <option value="office">Office / Commercial</option>
                  <option value="institution">School / College / Institution</option>
                  <option value="business">SME / Retail Business</option>
                  <option value="enterprise">Large Enterprise / ISP</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-foreground/60 mb-1">
                  Town / Center *
                </label>
                <input
                  type="text"
                  required
                  value={locationTown}
                  onChange={(e) => setLocationTown(e.target.value)}
                  placeholder="e.g. Eldoret, Nairobi, Nakuru"
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-glass text-sm text-foreground focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-foreground/60 mb-1">
                  Physical Address / Estate
                </label>
                <input
                  type="text"
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  placeholder="Estate, building, floor or landmark"
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-glass text-sm text-foreground focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-foreground/60 mb-1">
                  Timeline / Urgency
                </label>
                <select
                  value={urgency}
                  onChange={(e: any) => setUrgency(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border-glass text-sm text-foreground focus:outline-none focus:border-brand"
                >
                  <option value="low">Standard / Flexible</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent Deployment</option>
                </select>
              </div>
            </div>

            {/* Context Specific Inputs */}
            {serviceType === 'software_custom_app' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-surface/50 border border-border-glass">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-foreground/60 mb-1">
                    Application Architecture
                  </label>
                  <select
                    value={softwarePlatform}
                    onChange={(e) => setSoftwarePlatform(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-border-glass text-xs text-foreground focus:outline-none focus:border-brand"
                  >
                    <option value="Web & Mobile App">Full-Stack Web & Mobile App</option>
                    <option value="Mobile App Only (iOS & Android)">Mobile App Only (iOS & Android)</option>
                    <option value="Enterprise ERP / CRM Portal">Enterprise ERP / CRM Portal</option>
                    <option value="E-Commerce & Marketplace System">E-Commerce & Multi-Vendor System</option>
                    <option value="Custom API & Microservices">Custom API & Cloud Microservices</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-foreground/60 mb-1">
                    Estimated Budget (KES)
                  </label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. 150000"
                    className="w-full px-4 py-2 rounded-xl bg-surface border border-border-glass text-xs text-foreground focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
            )}

            {serviceType === 'ai_configuration' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-surface/50 border border-border-glass">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-foreground/60 mb-1">
                    AI Integration Type
                  </label>
                  <select
                    value={aiScope}
                    onChange={(e) => setAiScope(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-border-glass text-xs text-foreground focus:outline-none focus:border-brand"
                  >
                    <option value="Business Automation & Customer Support">Business Automation & Support AI Bot</option>
                    <option value="Local Private LLM (On-Premises Data)">Local Private LLM (Secure On-Premises)</option>
                    <option value="Smart Home & IoT AI Systems">Smart Home & Building IoT AI</option>
                    <option value="CCTV Computer Vision & Security AI">CCTV Computer Vision & Security AI</option>
                    <option value="Institutional AI & Grading Tools">Institutional / Academic AI Tools</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-foreground/60 mb-1">
                    Target Budget (KES)
                  </label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. 80000"
                    className="w-full px-4 py-2 rounded-xl bg-surface border border-border-glass text-xs text-foreground focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
            )}

            {serviceType === 'isp_management' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-surface/50 border border-border-glass">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-foreground/60 mb-1">
                    Current / Target Subscriber Base
                  </label>
                  <select
                    value={ispClients}
                    onChange={(e) => setIspClients(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-border-glass text-xs text-foreground focus:outline-none focus:border-brand"
                  >
                    <option value="Under 100 Subscribers">Under 100 Subscribers (Startup ISP)</option>
                    <option value="100 - 500 Subscribers">100 - 500 Subscribers</option>
                    <option value="500 - 2,000 Subscribers">500 - 2,000 Subscribers</option>
                    <option value="2,000+ Enterprise Network">2,000+ Enterprise Network</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-foreground/60 mb-1">
                    Core Requirements
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="MikroTik RouterOS, M-Pesa STK, Vouchers..."
                    className="w-full px-4 py-2 rounded-xl bg-surface border border-border-glass text-xs text-foreground focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
            )}

            {serviceType === 'electron_network' && (
              <div className="p-4 rounded-2xl bg-surface/50 border border-border-glass space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-wider text-brand">
                  Selected Electron Unlimited Broadband Tier
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { title: 'Starter 15 Mbps', price: 'KES 2,499 / mo', desc: 'Home streaming & browsing' },
                    { title: 'Turbo 30 Mbps', price: 'KES 3,999 / mo', desc: 'Smart home & 4K gaming' },
                    { title: 'Ultra 60 Mbps', price: 'KES 5,999 / mo', desc: 'Offices & multi-device teams' },
                  ].map((plan, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setElectronPlan(`${plan.title} (${plan.price})`)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        electronPlan.includes(plan.title)
                          ? 'border-brand bg-brand/10 text-foreground'
                          : 'border-border-glass bg-surface text-foreground/70 hover:border-border-glass'
                      }`}
                    >
                      <p className="font-bold text-xs">{plan.title}</p>
                      <p className="text-brand font-black text-xs">{plan.price}</p>
                      <p className="text-[10px] text-foreground/50 mt-1">{plan.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {serviceType === 'satellite_internet' && (
              <div className="p-4 rounded-2xl bg-surface/50 border border-border-glass space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-wider text-brand">
                  Satellite Connection Kit & Quotation
                </label>
                <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-surface border border-border-glass">
                  <div>
                    <span className="text-xs font-black uppercase text-foreground">{satelliteKitSelected}</span>
                    <p className="text-[11px] text-foreground/60">Standard Kit + Precision Mount + Fast Activation</p>
                  </div>
                  {initialQuotationKes ? (
                    <span className="text-emerald-400 font-black text-sm">
                      Total: KES {Number(initialQuotationKes).toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-black text-sm">From KES 46,500 Complete</span>
                  )}
                </div>
              </div>
            )}

            {/* Additional Project Specifications */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-foreground/60 mb-1">
                Project Scope, Requirements or Address Details
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe your technical requirements, number of users, specific integrations or physical address notes..."
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border-glass text-xs text-foreground focus:outline-none focus:border-brand"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <span>⚠️</span> {errorMsg}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-glass">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-foreground/70 hover:text-foreground hover:bg-surface transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3.5 rounded-full bg-brand text-black font-black uppercase tracking-widest text-xs hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg cursor-pointer"
              >
                {submitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <span>🚀</span> Submit Request
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ServiceInquiryModal;
