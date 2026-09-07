import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/store';
import { setActiveCompany } from '../store/authSlice';
import api from '../api/axios';

interface Company {
  _id: string;
  name: string;
}

interface CompanySelectorProps {
  onAddCompany?: () => void;
}

const CompanySelector = ({ onAddCompany }: CompanySelectorProps) => {
  const dispatch = useDispatch();
  const activeCompanyId = useSelector((state: RootState) => state.auth.activeCompanyId);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.get('/companies')
      .then(res => setCompanies(res.data.companies || []))
      .catch(() => {});
  }, [activeCompanyId]);

  const activeCompany = companies.find(c => c._id === activeCompanyId);

  const handleSelect = (id: string) => {
    dispatch(setActiveCompany({ companyId: id }));
    setOpen(false);
  };

  const hasMultipleOptions = companies.length > 1 || !!onAddCompany;

  if (companies.length === 0 && !onAddCompany) return null;

  return (
    <>
      {/* TRIGGER PILL */}
      <button
        onClick={() => hasMultipleOptions ? setOpen(true) : undefined}
        className={`flex items-center bg-teal-700/50 border border-teal-600 text-white text-xs font-semibold pl-3 pr-2 py-1.5 rounded-full max-w-[140px] ${hasMultipleOptions ? 'cursor-pointer active:bg-teal-600' : 'cursor-default'}`}
      >
        <span className="truncate">{activeCompany?.name || (companies.length === 0 ? 'No Company' : 'Select Company')}</span>
        {hasMultipleOptions && (
          <svg className="w-3 h-3 ml-1 flex-shrink-0 text-teal-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* BOTTOM SHEET */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Sheet */}
          <div
            className="relative bg-white rounded-t-3xl shadow-2xl p-4 pb-8 animate-slide-up"
            onClick={e => e.stopPropagation()}
            style={{ animation: 'slideUp 0.25s ease-out' }}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

            <h2 className="text-base font-bold text-gray-800 mb-4 px-1">Switch Company</h2>

            <div className="space-y-2">
              {companies.map(c => {
                const isActive = c._id === activeCompanyId;
                return (
                  <button
                    key={c._id}
                    onClick={() => handleSelect(c._id)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-left transition-colors ${
                      isActive
                        ? 'bg-teal-700 text-white'
                        : 'bg-gray-50 text-gray-800 hover:bg-teal-50 active:bg-teal-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm mr-3 ${isActive ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800'}`}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-sm">{c.name}</span>
                    </div>
                    {isActive && (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
              
              {onAddCompany && (
                <button
                  onClick={() => {
                    setOpen(false);
                    onAddCompany();
                  }}
                  className="w-full flex items-center px-4 py-3.5 rounded-2xl text-left bg-teal-50 text-teal-800 hover:bg-teal-100 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg mr-3 bg-teal-200 text-teal-800">
                    +
                  </div>
                  <span className="font-bold text-sm">Add Company</span>
                </button>
              )}
            </div>

            <button
              onClick={() => setOpen(false)}
              className="w-full mt-4 py-3.5 bg-gray-100 text-gray-600 font-semibold rounded-2xl text-sm active:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default CompanySelector;
