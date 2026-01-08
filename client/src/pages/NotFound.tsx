import { Link } from '@tanstack/react-router';

const NotFound = () => {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 animate-in fade-in duration-700">
            <div className="relative mb-10">
                <div className="text-[12rem] font-black text-white/5 select-none leading-none">404</div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-8xl transform hover:scale-110 transition-premium cursor-default">🚧</div>
                </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                Oops! Lost in <span className="text-brand">Space</span>?
            </h1>

            <p className="text-white/60 text-lg max-w-md mx-auto mb-10 font-medium">
                The page you're looking for has been moved, deleted, or never existed in the first place.
            </p>

            <Link
                to="/home"
                className="premium-gradient text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:opacity-90 active:scale-95 transition-premium shadow-lg inline-block"
            >
                🚀 Back to Safety
            </Link>

            <div className="mt-16 text-white/20 text-xs font-bold uppercase tracking-[0.3em]">
                Electro-Care Diagnostic System
            </div>
        </div>
    );
};

export default NotFound;
