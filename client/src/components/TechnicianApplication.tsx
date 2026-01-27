import React, { useState } from 'react';
import RoleApplicationModal from './RoleApplicationModal';

const TechnicianApplication: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-lg transition-premium text-sm font-bold text-white/80"
      >
        <span className="text-lg">👨‍🔧</span> Apply: Technician
      </button>

      <RoleApplicationModal
        role="technician"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default TechnicianApplication;