import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../utils/apiClient';

interface RoleApplicationModalProps {
    role: 'technician' | 'delivery';
    isOpen: boolean;
    onClose: () => void;
}

const RoleApplicationModal: React.FC<RoleApplicationModalProps> = ({ role, isOpen, onClose }) => {
    const [notes, setNotes] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const mutation = useMutation({
        mutationFn: (data: { documents: string[], notes: string }) =>
            apiClient.post(`/recruitment/apply-${role}`, data),
        onSuccess: () => {
            alert('Application submitted successfully! It is now pending admin approval.');
            onClose();
        },
        onError: (error: any) => {
            alert(error.response?.data?.error || 'Failed to submit application');
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);

        try {
            const imageUrls: string[] = [];

            // Upload each file
            for (const file of files) {
                const formData = new FormData();
                formData.append('image', file);
                const { data } = await apiClient.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                imageUrls.push(data.imageUrl);
            }

            mutation.mutate({ documents: imageUrls, notes });
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
            <div className="relative w-full max-w-xl glass-card rounded-[2.5rem] border border-white/10 shadow-premium p-10 animate-in zoom-in-95 duration-300">
                <button onClick={onClose} className="absolute top-8 right-8 text-white/40 hover:text-white transition-premium">
                    <span className="text-2xl font-black">✕</span>
                </button>

                <div className="text-center mb-10">
                    <div className="text-5xl mb-4">{role === 'technician' ? '👨‍🔧' : '🚚'}</div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight">
                        Apply as <span className="text-brand">{role}</span>
                    </h2>
                    <p className="text-white/40 mt-2 text-sm">Submit your documentation for administrative review.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Verification Documents</label>
                        <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none transition-premium text-white file:bg-brand/20 file:border-none file:text-brand file:font-black file:uppercase file:text-[10px] file:px-4 file:py-2 file:rounded-lg file:mr-4 hover:file:bg-brand/30"
                        />
                        <p className="text-[10px] text-white/20 ml-1 font-bold">Please upload at least 3 documents (ID, Certifications, etc.)</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Experience & Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Tell us about your background..."
                            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none transition-premium text-white h-32 resize-none placeholder:text-white/10"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={mutation.isPending || isUploading}
                        className="w-full vibrant-gradient text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:opacity-90 transition-premium shadow-xl disabled:opacity-50"
                    >
                        {mutation.isPending || isUploading ? 'Processing Application...' : '🚀 Submit Application'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RoleApplicationModal;
