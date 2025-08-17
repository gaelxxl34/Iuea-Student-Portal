'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarItemProps {
  path: string;
  icon: string;
  label: string;
}

interface DashboardSidebarProps {
  isMobile: boolean;
  isOpen: boolean;
}

const SidebarItem = ({ path, icon, label }: SidebarItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === path;
  
  return (
    <Link 
      href={path} 
      className={isActive ? 'sidebar-active' : 'sidebar-item'}
    >
      <i className={`ri-${icon} ${isActive ? 'text-red-800' : 'text-slate-600'}`}></i>
      <span>{label}</span>
    </Link>
  );
};

export default function DashboardSidebar({ isMobile, isOpen }: DashboardSidebarProps) {
  // Navigation items - always accessible regardless of application status
  const navItems = [
    { path: '/dashboard', icon: 'dashboard-line', label: 'Dashboard' },
    { path: '/dashboard/application', icon: 'file-list-3-line', label: 'My Application' },
    { path: '/dashboard/documents', icon: 'file-upload-line', label: 'Documents' },
  ];

  if (isMobile && !isOpen) {
    return null;
  }

  return (
    <aside 
      className={`${isMobile ? 'fixed inset-y-0 left-0 z-20' : 'w-64'} dashboard-sidebar overflow-y-auto`}
      style={{ 
        width: isMobile ? '250px' : '',
        top: isMobile ? '56px' : '', // Account for header height
        boxShadow: isMobile ? '2px 0 8px rgba(0, 0, 0, 0.1)' : 'none' 
      }}
    >
      {/* Sidebar Content */}
      <div className="py-2">
        {/* Quick Navigation Info */}
        <div className="px-4 py-2 mb-4">
          <span className="text-xs font-medium text-slate-500 uppercase">Student Portal</span>
          <p className="text-sm font-medium text-slate-700">Navigation</p>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <SidebarItem key={item.path} {...item} />
          ))}
        </nav>
        
        {/* Help Section */}
        <div className="mt-6 px-4 py-3 mx-2 bg-slate-50 rounded-lg">
          <div className="text-xs font-medium text-slate-600 mb-2">Need Help?</div>
          <div className="space-y-1">
            <div className="flex items-center text-xs text-slate-600">
              <i className="ri-phone-line mr-2 text-red-600"></i>
              <span>+256 414 142 631</span>
            </div>
            <div className="flex items-center text-xs text-slate-600">
              <i className="ri-mail-line mr-2 text-red-600"></i>
              <span>admissions@iuea.ac.ug</span>
            </div>
          </div>
        </div>
        
        {/* Logout Option (mobile only) */}
        {isMobile && (
          <>
            <div className="border-t border-[#EDEDED] my-4"></div>
            <div className="px-4 py-2">
              <Link href="/login" className="flex items-center gap-3 text-red-600">
                <i className="ri-logout-box-r-line"></i>
                <span>Logout</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
