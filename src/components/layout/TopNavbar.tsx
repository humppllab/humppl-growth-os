"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, Menu, LogOut } from 'lucide-react';
import { logoutAction } from '@/actions';

export default function TopNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logoutAction();
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shrink-0 relative">
      <div className="flex items-center flex-1">
        <button type="button" className="md:hidden p-2 -ml-2 mr-2 text-gray-400 hover:text-gray-500">
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
        <form className="w-full flex md:ml-0" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">Search</label>
          <div className="relative w-full text-gray-400 focus-within:text-gray-600 max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
              <Search className="h-5 w-5" aria-hidden="true" />
            </div>
            <input
              id="search-field"
              className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-transparent sm:text-sm bg-transparent"
              placeholder="Search..."
              type="search"
              name="search"
            />
          </div>
        </form>
      </div>
      <div className="ml-4 flex items-center md:ml-6 space-x-4 shrink-0">
        <button type="button" className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <span className="sr-only">View notifications</span>
          <Bell className="h-6 w-6" aria-hidden="true" />
        </button>

        <div className="relative">
          <button 
            type="button" 
            onClick={() => setIsOpen(!isOpen)}
            className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" 
            id="user-menu-button" 
            aria-expanded={isOpen} 
            aria-haspopup="true"
          >
            <span className="sr-only">Open user menu</span>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold shrink-0 hover:bg-blue-200 transition-colors">
              SU
            </div>
          </button>

          {isOpen && (
            <>
              {/* Click outside overlay */}
              <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
              
              {/* Dropdown Card */}
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg py-1 bg-white border border-gray-100 ring-1 ring-black/5 focus:outline-none z-20 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Signed in as</p>
                  <p className="text-sm font-bold text-gray-900 truncate">Sumit & Aditi</p>
                  <p className="text-xs text-gray-500 truncate">admin@humppl.com</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors font-medium"
                >
                  <LogOut className="mr-2 h-4 w-4 shrink-0" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
