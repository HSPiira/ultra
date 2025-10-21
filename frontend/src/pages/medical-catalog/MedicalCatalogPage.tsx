import React from 'react';

const MedicalCatalogPage: React.FC = () => {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Medical Catalog</h1>
        <p className="text-gray-400 mt-2">
          Manage medical services and items
        </p>
      </div>
      <div className="rounded-lg p-6 shadow-sm" style={{ backgroundColor: '#1a1a1a', borderColor: '#2a2a2a' }}>
        <p className="text-gray-400">Medical catalog interface will be implemented here</p>
      </div>
    </>
  );
};

export default MedicalCatalogPage;
