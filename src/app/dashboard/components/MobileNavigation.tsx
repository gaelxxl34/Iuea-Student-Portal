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
      className={isActive ? 'mobile-nav-item-active' : 'mobile-nav-item'}
    >
      <i className={`ri-${icon} ${isActive ? 'text-red-400' : 'text-gray-400'}`}></i>
      <span className="text-xs mt-1">{label}</span>
    </Link>
  );
};

export default function MobileNavigation() {
  const navItems = [
    { path: '/dashboard', icon: 'dashboard-line', label: 'Home' },
    { path: '/dashboard/application', icon: 'file-list-3-line', label: 'Apply' },
    { path: '/dashboard/documents', icon: 'file-upload-line', label: 'Documents' },
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 flex justify-around items-center h-16">
      {navItems.map((item) => (
        <MobileNavItem key={item.path} {...item} />
      ))}
    </div>
  );
}
