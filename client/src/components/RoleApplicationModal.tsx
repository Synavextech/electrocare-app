import React, { useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from '../utils/apiClient';
import { UploadCloud, FileText, CheckCircle2, Trash2, MapPin, Wrench, Truck } from 'lucide-react';

interface RoleApplicationModalProps {
    role: 'technician' | 'delivery';
    isOpen: boolean;
    onClose: () => void;
}

const COMMON_DEVICES = ['Tecno', 'Itel', 'Samsung', 'iPhone', 'Redmi/Xiaomi', 'Infinix', 'Oppo', 'Huawei'];

const RoleApplicationModal: React.FC<RoleApplicationModalProps> = ({ role, isOpen, onClose }) => {
    const [notes, setNotes] = useState('');
    const [phone, setPhone] = useState('');
    const [shopId, setShopId] = useState('');
    const [locality, setLocality] = useState('');

    // Delivery-specific state
    const [vehicleType, setVehicleType] = useState<'motorbike' | 'car'>('motorbike');
    const [deliveryFrequency, setDeliveryFrequency] = useState<'on_call' | 'one_time_24hr'>('on_call');

    // Technician-specific state
    const [preferredDevices, setPreferredDevices] = useState<string>('Tecno, Itel, Samsung, iPhone');
    const [proficiency, setProficiency] = useState<string[]>(['hardware_diagnostic', 'software_diagnostic']);
    const [experienceLevel, setExperienceLevel] = useState<'fully_experienced' | 'require_skill_upgrade' | 'require_full_training'>('fully_experienced');

    const [files, setFiles] = useState<{ cv: File | null; idDoc: File | null; certificate: File | null }>({
        cv: null,
        idDoc: null,
        certificate: null
    });
    const [isUploading, setIsUploading] = useState(false);

    const inputRefs = {
        cv: useRef<HTMLInputElement>(null),
        idDoc: useRef<HTMLInputElement>(null),
        certificate: useRef<HTMLInputElement>(null)
    };

    const handleFileChange = (key: 'cv' | 'idDoc' | 'certificate', file: File | null) => {
        setFiles(prev => ({ ...prev, [key]: file }));
    };

    const handleRemoveFile = (e: React.MouseEvent, key: 'cv' | 'idDoc' | 'certificate') => {
        e.stopPropagation();
        e.preventDefault();
        setFiles(prev => ({ ...prev, [key]: null }));
        if (inputRefs[key].current) {
            inputRefs[key].current.value = '';
        }
    };

    const toggleProficiency = (item: string) => {
        setProficiency(prev =>
            prev.includes(item) ? prev.filter(p => p !== item) : [...prev, item]
        );
    };

    const toggleDeviceTag = (dev: string) => {
        const currentList = preferredDevices
            ? preferredDevices.split(',').map(d => d.trim()).filter(Boolean)
            : [];
        if (currentList.includes(dev)) {
            setPreferredDevices(currentList.filter(d => d !== dev).join(', '));
        } else {
            setPreferredDevices([...currentList, dev].join(', '));
        }
    };

    const { data: shops } = useQuery({
        queryKey: ['shops-list'],
        queryFn: () => apiClient.get('/shops').then((res) => res.data),
    });

    const mutation = useMutation({
        mutationFn: (data: any) =>
            apiClient.post(`/recruitment/apply-${role}`, data),
        onSuccess: () => {
            alert('Application submitted successfully! It is now pending admin approval.');
            onClose();
        },
        onError: (error: any) => {
            alert(error.response?.data?.error || 'Failed to submit application');
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!files.cv || !files.idDoc || !files.certificate) {
            alert('Please upload all required documents: CV, ID, and Qualification Certificate.');
            return;
        }

        setIsUploading(true);

        try {
            const imageUrls: string[] = [];

            // Upload strictly in order: CV, ID, Certificate
            const filesToUpload = [files.cv, files.idDoc, files.certificate];
            for (const file of filesToUpload) {
                const formData = new FormData();
                formData.append('image', file as File);
                formData.append('folder', 'documents');
                const { data } = await apiClient.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                imageUrls.push(data.imageUrl);
            }

            const payload: any = {
                documents: imageUrls,
                notes,
                phone,
                shopId: shopId || null,
                locality: locality.trim() || null,
            };

            if (role === 'delivery') {
                payload.vehicleType = vehicleType;
                payload.deliveryFrequency = deliveryFrequency;
            } else if (role === 'technician') {
                payload.preferredDevices = preferredDevices
                    ? preferredDevices.split(',').map(d => d.trim()).filter(Boolean)
                    : [];
                payload.proficiency = proficiency;
                payload.experienceLevel = experienceLevel;
            }

            mutation.mutate(payload);
        } catch (error) {
            alert('File upload failed. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-3xl glass-card rounded-[2.5rem] border border-white/10 shadow-premium p-8 md:p-10 animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
                <button onClick={onClose} className="absolute top-8 right-8 text-white/40 hover:text-white transition-premium cursor-pointer">
                    <span className="text-2xl font-black">✕</span>
                </button>

                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">{role === 'technician' ? '👨‍🔧' : '🚚'}</div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight">
                        Apply as <span className="text-brand">{role}</span>
                    </h2>
                    <p className="text-white/40 mt-1.5 text-xs">Join ElectroCare's certified professional network.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Contact & Locality */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase tracking-widest text-white/50 ml-1">Phone Number</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+254 700 000000"
                                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl outline-none transition-premium text-white placeholder:text-white/20 text-sm focus:border-brand"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase tracking-widest text-white/50 ml-1">Preferred Locality / Area</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={locality}
                                    onChange={(e) => setLocality(e.target.value)}
                                    placeholder="e.g. Westlands, CBD, Kilimani"
                                    className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl outline-none transition-premium text-white placeholder:text-white/20 text-sm focus:border-brand"
                                    required
                                />
                                <MapPin className="w-4 h-4 text-white/30 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase tracking-widest text-white/50 ml-1">Preferred Center</label>
                            <select
                                value={shopId}
                                onChange={(e) => setShopId(e.target.value)}
                                className="w-full px-4 py-3.5 bg-slate-900 border border-white/10 rounded-2xl outline-none transition-premium text-white text-sm focus:border-brand"
                            >
                                <option value="">-- Any Nearby Hub --</option>
                                {shops?.map((shop: any) => (
                                    <option key={shop.id} value={shop.id} className="text-white bg-slate-900">
                                        {shop.name} ({shop.county || shop.address})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Role-Specific Section: Delivery Personnel */}
                    {role === 'delivery' && (
                        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-5 animate-in fade-in duration-300">
                            <div className="flex items-center gap-2">
                                <Truck className="w-5 h-5 text-cyan-400" />
                                <h4 className="text-xs font-black uppercase tracking-widest text-cyan-400">
                                    Delivery Logistics & Vehicle Parameters
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Means of Transport */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-white/70 block">
                                        Available Means of Transport <span className="text-rose-400">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: 'motorbike' as const, label: 'Motorbike', icon: '🏍️', desc: 'Fast agile courier' },
                                            { id: 'car' as const, label: 'Car / Van', icon: '🚗', desc: 'Protected cargo transport' },
                                        ].map((v) => (
                                            <button
                                                key={v.id}
                                                type="button"
                                                onClick={() => setVehicleType(v.id)}
                                                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                                    vehicleType === v.id
                                                        ? 'bg-cyan-500/15 border-cyan-400 ring-2 ring-cyan-400/30'
                                                        : 'bg-white/5 border-white/10 hover:border-cyan-400/30'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-lg">{v.icon}</span>
                                                    <span className="text-xs font-black text-white">{v.label}</span>
                                                </div>
                                                <p className="text-[10px] text-white/50">{v.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Delivery Frequency */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-white/70 block">
                                        Delivery Frequency Availability <span className="text-rose-400">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: 'on_call' as const, label: 'On-Call', icon: '⚡', desc: 'Real-time express dispatch' },
                                            { id: 'one_time_24hr' as const, label: '24hr One-Time', icon: '📦', desc: 'Scheduled daily runs' },
                                        ].map((f) => (
                                            <button
                                                key={f.id}
                                                type="button"
                                                onClick={() => setDeliveryFrequency(f.id)}
                                                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                                    deliveryFrequency === f.id
                                                        ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/30'
                                                        : 'bg-white/5 border-white/10 hover:border-amber-400/30'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-lg">{f.icon}</span>
                                                    <span className="text-xs font-black text-white">{f.label}</span>
                                                </div>
                                                <p className="text-[10px] text-white/50">{f.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Role-Specific Section: Technician */}
                    {role === 'technician' && (
                        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-5 animate-in fade-in duration-300">
                            <div className="flex items-center gap-2">
                                <Wrench className="w-5 h-5 text-brand" />
                                <h4 className="text-xs font-black uppercase tracking-widest text-brand">
                                    Technical Expertise & Diagnostics
                                </h4>
                            </div>

                            {/* Devices Experienced Repairing */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-bold text-white/70">
                                        Devices I am Experienced Repairing
                                    </label>
                                    <span className="text-[10px] text-white/40">Click tags or type below</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {COMMON_DEVICES.map((dev) => {
                                        const isSelected = preferredDevices.toLowerCase().includes(dev.toLowerCase());
                                        return (
                                            <button
                                                key={dev}
                                                type="button"
                                                onClick={() => toggleDeviceTag(dev)}
                                                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                                                    isSelected
                                                        ? 'bg-brand/20 text-brand border-brand/40 shadow-sm'
                                                        : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:border-white/20'
                                                }`}
                                            >
                                                {dev} {isSelected ? '✓' : '+'}
                                            </button>
                                        );
                                    })}
                                </div>
                                <input
                                    type="text"
                                    value={preferredDevices}
                                    onChange={(e) => setPreferredDevices(e.target.value)}
                                    placeholder="e.g. Tecno, Itel, Samsung, iPhone, Xiaomi, HP, Dell"
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl outline-none transition-premium text-white placeholder:text-white/20 text-sm focus:border-brand"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Technical Proficiency */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-white/70 block">
                                        Technical Proficiency Areas
                                    </label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { id: 'software_diagnostic', label: 'Software Diagnostic', icon: '💻', desc: 'OS flash, unbrick, unlock, data recovery' },
                                            { id: 'hardware_diagnostic', label: 'Hardware Diagnostic', icon: '🛠️', desc: 'Screen, port, battery, motherboard repair' },
                                        ].map((prof) => {
                                            const active = proficiency.includes(prof.id);
                                            return (
                                                <button
                                                    key={prof.id}
                                                    type="button"
                                                    onClick={() => toggleProficiency(prof.id)}
                                                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                                        active
                                                            ? 'bg-brand/15 border-brand ring-1 ring-brand/30'
                                                            : 'bg-white/5 border-white/10 hover:border-brand/30'
                                                    }`}
                                                >
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span>{prof.icon}</span>
                                                            <span className="text-xs font-bold text-white">{prof.label}</span>
                                                        </div>
                                                        <p className="text-[10px] text-white/50 mt-0.5">{prof.desc}</p>
                                                    </div>
                                                    <span className={`text-xs font-bold ${active ? 'text-brand' : 'text-white/20'}`}>
                                                        {active ? '✓' : '○'}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Experience & Skill Level */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-white/70 block">
                                        Skill & Experience Level
                                    </label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { id: 'fully_experienced' as const, label: 'Fully Experienced', icon: '🌟', desc: 'Master specialist ready for complex repairs' },
                                            { id: 'require_skill_upgrade' as const, label: 'Require Skill Upgrade', icon: '📈', desc: 'Experienced, seeking advanced board/chip training' },
                                            { id: 'require_full_training' as const, label: 'Require Full Training', icon: '🎓', desc: 'Apprentice seeking complete qualification' },
                                        ].map((lvl) => (
                                            <button
                                                key={lvl.id}
                                                type="button"
                                                onClick={() => setExperienceLevel(lvl.id)}
                                                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                                    experienceLevel === lvl.id
                                                        ? 'bg-emerald-500/15 border-emerald-400 ring-1 ring-emerald-400/30'
                                                        : 'bg-white/5 border-white/10 hover:border-emerald-400/30'
                                                }`}
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span>{lvl.icon}</span>
                                                        <span className="text-xs font-bold text-white">{lvl.label}</span>
                                                    </div>
                                                    <p className="text-[10px] text-white/50 mt-0.5">{lvl.desc}</p>
                                                </div>
                                                <span className={`text-xs font-bold ${experienceLevel === lvl.id ? 'text-emerald-400' : 'text-white/20'}`}>
                                                    {experienceLevel === lvl.id ? '✓' : '○'}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Document Uploads */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { label: 'CV / Resume', key: 'cv' as const, hint: 'PDF or Word format' },
                            { label: 'National ID / Passport', key: 'idDoc' as const, hint: 'Clear front & back scan' },
                            { label: 'Qualification Cert', key: 'certificate' as const, hint: 'Technical certificate / degree' }
                        ].map((doc) => {
                            const file = files[doc.key];
                            return (
                                <div key={doc.key} className="space-y-1.5">
                                    <div className="flex items-center justify-between ml-1">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-white/50">{doc.label}</label>
                                        {file && (
                                            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Attached
                                            </span>
                                        )}
                                    </div>

                                    <div
                                        onClick={() => inputRefs[doc.key].current?.click()}
                                        className={`relative cursor-pointer min-h-[135px] rounded-2xl p-4 border-2 transition-all flex flex-col justify-between items-center text-center group ${
                                            file
                                                ? 'bg-brand/10 border-brand/40 hover:border-brand/60'
                                                : 'bg-white/5 border-dashed border-white/15 hover:border-brand/40 hover:bg-white/[0.08]'
                                        }`}
                                    >
                                        <input
                                            type="file"
                                            ref={inputRefs[doc.key]}
                                            onChange={(e) => handleFileChange(doc.key, e.target.files?.[0] || null)}
                                            className="hidden"
                                            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                        />

                                        {file ? (
                                            <>
                                                <div className="flex flex-col items-center justify-center flex-1 w-full pt-1">
                                                    <div className="w-10 h-10 rounded-xl bg-brand/20 text-brand flex items-center justify-center mb-2">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <span className="text-xs font-bold text-white max-w-[170px] truncate" title={file.name}>
                                                        {file.name}
                                                    </span>
                                                    <span className="text-[10px] text-white/40 mt-0.5">
                                                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={(e) => handleRemoveFile(e, doc.key)}
                                                    className="mt-2 w-full py-1.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    Detach Document
                                                </button>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center flex-1 py-2">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 text-white/40 group-hover:text-brand group-hover:bg-brand/10 transition-all flex items-center justify-center mb-2">
                                                    <UploadCloud className="w-5 h-5" />
                                                </div>
                                                <span className="text-xs font-bold text-white/80 group-hover:text-white transition-colors">
                                                    Choose File
                                                </span>
                                                <span className="text-[10px] text-white/30 mt-1">
                                                    {doc.hint}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black uppercase tracking-widest text-white/50 ml-1">Experience & Background Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Tell us about your background, years in service, notable repair cases, or delivery routes..."
                            className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl outline-none transition-premium text-white h-20 resize-none placeholder:text-white/20 text-sm focus:border-brand"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={mutation.isPending || isUploading}
                        className="w-full vibrant-gradient text-white py-4.5 rounded-2xl font-black uppercase tracking-widest hover:opacity-90 transition-premium shadow-xl disabled:opacity-50 cursor-pointer text-xs"
                    >
                        {mutation.isPending || isUploading ? 'Processing Application...' : '🚀 Submit Professional Application'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RoleApplicationModal;
