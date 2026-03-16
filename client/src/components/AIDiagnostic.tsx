import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AIDiagnostic = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [report, setReport] = useState<null | {
        status: string;
        issues: string[];
        recommendation: string;
    }>(null);

    const startScan = () => {
        setIsScanning(true);
        setReport(null);
        setProgress(0);

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsScanning(false);
                    generateReport();
                    return 100;
                }
                return prev + 2;
            });
        }, 50);
    };

    const generateReport = () => {
        setReport({
            status: 'Attention Required',
            issues: [
                'Battery health at 78% (Service Recommended)',
                'Minor display latency detected in sector 4B',
                'Unoptimized background processes (High CPU usage)'
            ],
            recommendation: 'Schedule a specialized AI-Aided hardware optimization at your nearest ElectroCare hub.'
        });
    };

    return (
        <div className="bg-white rounded-[3rem] p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 max-w-4xl mx-auto overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8">
                <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
            </div>

            <div className="text-center mb-12">
                <span className="text-primary font-black tracking-[0.2em] uppercase text-[10px] mb-4 block">Engine V2.0</span>
                <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">AI <span className="text-primary italic">Live</span> Diagnostics</h2>
            </div>

            <div className="flex flex-col items-center">
                {!isScanning && !report && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-10"
                    >
                        <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-8 mx-auto group">
                            <span className="text-5xl group-hover:scale-110 transition-transform duration-500">🧠</span>
                        </div>
                        <p className="text-gray-500 mb-10 max-w-md mx-auto font-light leading-relaxed">
                            Connect your device or allow system access to run a deep-level AI scan of your hardware and software health.
                        </p>
                        <button 
                            onClick={startScan}
                            className="bg-gray-900 hover:bg-primary text-white px-12 py-5 rounded-2xl uppercase tracking-widest text-xs font-black transition-all duration-500 shadow-xl hover:shadow-primary/40"
                        >
                            Start AI Diagnostic Scan
                        </button>
                    </motion.div>
                )}

                {isScanning && (
                    <div className="w-full space-y-8 py-10">
                        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div 
                                className="absolute top-0 left-0 h-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <span>Scanning Circuitry...</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {['Kernel', 'Battery', 'GPU', 'Thermal'].map((module, i) => (
                                <div key={i} className="bg-gray-50 p-4 rounded-xl flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-600">{module}</span>
                                    {progress > (i + 1) * 20 ? (
                                        <span className="text-primary text-[10px] font-black">OK</span>
                                    ) : (
                                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-pulse" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <AnimatePresence>
                    {report && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full space-y-8 py-6"
                        >
                            <div className="p-6 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-6">
                                <div className="text-4xl">⚠️</div>
                                <div>
                                    <h4 className="text-red-900 font-black uppercase text-sm tracking-tight">System Status: {report.status}</h4>
                                    <p className="text-red-700/70 text-xs font-medium italic">Deep Scan Completed</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {report.issues.map((issue, i) => (
                                    <div key={i} className="flex items-center gap-4 text-sm text-gray-600 font-medium">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                        {issue}
                                    </div>
                                ))}
                            </div>

                            <div className="p-8 bg-gray-900 rounded-[2rem] text-white">
                                <p className="text-xs font-black uppercase tracking-widest text-primary mb-4">AI Recommendation</p>
                                <p className="text-sm font-light leading-relaxed mb-6 italic">"{report.recommendation}"</p>
                                <button className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-primary transition-all duration-500">
                                    Book AI-Aided Repair
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AIDiagnostic;
