import { Link } from '@tanstack/react-router';
import Footer from '../components/Footer';
import useAuth from '../hooks/useAuth';

const Landing = () => {
    const { user } = useAuth();
    return (
        <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
            {/* Hero Section */}
            <section className="relative h-screen w-full overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="/images/hero.gif"
                        alt="Electro-Care Hero"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                </div>
                <div className="relative z-10 h-full flex flex-col justify-center items-center text-center text-white px-4">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-wider mb-6 uppercase drop-shadow-lg">Electro-Care</h1>
                    <p className="text-xl md:text-2xl font-light tracking-wide max-w-2xl mx-auto mb-12 drop-shadow-md">Precision. Reliability. Excellence.</p>
                    <Link to={user ? "/home" : "/login"}>
                        <span className="cursor-pointer bg-primary hover:bg-green-800 text-white px-10 py-4 rounded uppercase tracking-widest text-sm font-semibold transition-all duration-300 border border-transparent hover:border-accent backdrop-blur-sm shadow-lg">
                            {user ? 'Go to Home Dashboard' : 'Login/Register to get Started'}
                        </span>
                    </Link>
                </div>
            </section>

            {/* Services Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-primary mb-16 uppercase tracking-wide">
                        Our Services
                    </h2>
                    <div className="grid md:grid-cols-3 gap-12">
                        <Link to="/schedule">
                            <div className="group p-10 border border-gray-200 rounded-lg hover:border-accent transition-all duration-300 hover:shadow-xl bg-gray-50 cursor-pointer h-full text-center">
                                <div className="text-4xl mb-4">🛠️</div>
                                <h3 className="text-xl font-semibold mb-4 text-gray-800 uppercase tracking-wider">Repairs</h3>
                                <p className="text-gray-600 font-light">Expert repair for phones, laptops, and tablets with precision.</p>
                            </div>
                        </Link>
                        <Link to="/marketplace">
                            <div className="group p-10 border border-gray-200 rounded-lg hover:border-accent transition-all duration-300 hover:shadow-xl bg-gray-50 cursor-pointer h-full text-center">
                                <div className="text-4xl mb-4">🛒</div>
                                <h3 className="text-xl font-semibold mb-4 text-gray-800 uppercase tracking-wider">Marketplace</h3>
                                <p className="text-gray-600 font-light">Buy, sell, or trade used and refurbished devices securely.</p>
                            </div>
                        </Link>
                        <div className="group p-10 border border-gray-200 rounded-lg hover:border-accent transition-all duration-300 hover:shadow-xl bg-gray-50 cursor-pointer h-full text-center">
                            <div className="text-4xl mb-4">♻️</div>
                            <h3 className="text-xl font-semibold mb-4 text-gray-800 uppercase tracking-wider">Recycling</h3>
                            <p className="text-gray-600 font-light">Responsible disposal and recycling of electronic waste.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="w-full bg-gray-100 py-20">
                <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8">
                        <h2 className="text-3xl md:text-4xl font-bold text-primary uppercase tracking-wide">  Why Choose Electro-Care?</h2>
                        <div>
                            <h4 className="text-xl font-semibold text-gray-800 mb-2">Excellence in Repair</h4>
                            <p className="text-gray-600">Our certified technicians use advanced diagnostics to fix your device correctly the first time.</p>
                        </div>
                        <div>
                            <h4 className="text-xl font-semibold text-gray-800 mb-2">Convenience & Security</h4>
                            <p className="text-gray-600">Enjoy doorstep pickup and delivery. Your data and device security are our top priority.</p>
                        </div>
                        <div>
                            <h4 className="text-xl font-semibold text-gray-800 mb-2">Eco-Friendly</h4>
                            <p className="text-gray-600">We promote sustainability through repair and responsible recycling of e-waste.</p>
                        </div>
                    </div>
                    <div className="rounded-lg overflow-hidden shadow-xl h-96">
                        <img
                            src="/images/auto.gif"
                            alt="Fast Repair Service"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export { Landing };
