'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MobileNavItemProps {
  path: string;
  icon: string;
  label: string;
}

const MobileNavItem = ({ path, icon, label }: MobileNavItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === path;
  
  return (
    <Link 
      href={path} 
      className={`flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 transition-colors duration-200 ${
        isActive 
          ? 'text-red-800' 
          : 'text-slate-600 hover:text-red-800'
      }`}
    >
      <i className={`ri-${icon} text-xl mb-1 ${isActive ? 'text-red-800' : 'text-slate-600'}`}></i>
      <span className={`text-xs font-medium truncate ${isActive ? 'text-red-800' : 'text-slate-600'}`}>
        {label}
      </span>
    </Link>
  );
};

export default function MobileNavigation() {
  // Navigation items - always accessible regardless of application status
  const navItems = [
    { path: '/dashboard', icon: 'dashboard-line', label: 'Home' },
    { path: '/dashboard/application', icon: 'file-list-3-line', label: 'Apply' },
    { path: '/dashboard/documents', icon: 'file-upload-line', label: 'Documents' },
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 shadow-lg z-50 lg:hidden">
      {navItems.map((item) => (
        <MobileNavItem key={item.path} {...item} />
      ))}
    </div>
  );
}
