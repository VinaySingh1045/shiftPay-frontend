import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const EmployeeLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { 
      name: 'Scan', 
      path: '/', 
      icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z' 
    },
    { 
      name: 'Calendar', 
      path: '/calendar', 
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' 
    },
    { 
      name: 'Salary', 
      path: '/salary', 
      icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' 
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* Dynamic Content */}
      <div className="flex-1">
        <Outlet />
      </div>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around items-center z-50">
        {navItems.map((item, idx) => {
          const isActive = location.pathname === item.path;
          return (
            <button 
              key={idx} 
              onClick={() => navigate(item.path)} 
              className={`flex flex-col items-center p-1 w-16 ${isActive ? 'text-teal-700' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                {item.name === 'Scan' && isActive && (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                )}
              </svg>
              <span className="text-[10px] font-semibold">{item.name}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default EmployeeLayout;
