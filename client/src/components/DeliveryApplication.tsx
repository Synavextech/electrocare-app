import React, { useState } from 'react';
import RoleApplicationModal from './RoleApplicationModal';

const DeliveryApplication: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-lg transition-premium text-sm font-bold text-white/80"
            >
                <span className="text-lg">🚚</span> Apply: Delivery Personnel
            </button>

            <RoleApplicationModal
                role="delivery"
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
};

export default DeliveryApplication;
