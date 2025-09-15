'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type AdminSidebarProps = {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean | ((v: boolean) => boolean)) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (v: boolean | ((v: boolean) => boolean)) => void;
};

export default function AdminSidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}: AdminSidebarProps) {
  return (
    <>
      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] md:hidden"
        />
      )}
      <aside
        className={`flex h-full flex-col overflow-y-auto bg-white px-4 py-8 transition-all duration-200 ease-in-out dark:bg-gray-900 ${
          isCollapsed ? 'w-16' : 'w-64'
        } fixed inset-y-0 left-0 z-50 -translate-x-full md:static md:translate-x-0`}
        data-state={isMobileOpen ? 'open' : 'closed'}
      >
        <div
          className={`h-full w-full transform transition-transform duration-200 ease-in-out ${
            isMobileOpen
              ? 'translate-x-0'
              : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Logo */}
          <Link href="/admin" className="flex items-center">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-white sm:h-7 sm:w-7">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            {!isCollapsed && (
              <span className="ml-2 text-lg font-semibold text-gray-800 dark:text-white">
                Администратор
              </span>
            )}
          </Link>

          {/* Navigation */}
          <div className="mt-6 flex flex-1 flex-col justify-between">
            <nav>
              <AdminSidebarLink
                href="/admin"
                label="Главная"
                icon={
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M19 11H5M19 11C20.1046 11 21 11.8954 21 13V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V13C3 11.8954 3.89543 11 5 11M19 11V9C19 7.89543 18.1046 7 17 7M5 11V9C5 7.89543 5.89543 7 7 7M7 7V5C7 3.89543 7.89543 3 9 3H15C16.1046 3 17 3.89543 17 5V7M7 7H17"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
                collapsed={isCollapsed}
              />

              <AdminSidebarLink
                href="/admin/drafts"
                label="Черновики"
                icon={
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 12h6M9 16h6M7 20h10a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
                collapsed={isCollapsed}
              />

              <AdminSidebarLink
                href="/admin/products"
                label="Товары"
                icon={
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
                collapsed={isCollapsed}
              />
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
}

function AdminSidebarLink({
  href,
  label,
  icon,
  collapsed,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`mt-5 flex transform items-center rounded-md px-4 py-2 text-gray-600 transition-colors duration-300 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 ${
        isActive
          ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'
          : ''
      }`}
    >
      {icon}
      {!collapsed && <span className="mx-4 font-medium">{label}</span>}
      {collapsed && <span className="sr-only">{label}</span>}
    </Link>
  );
}
