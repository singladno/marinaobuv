import { AdminSwitcher } from '@/components/ui/AdminSwitcher';
import Footer from '@/components/ui/Footer';
import { GruzchikSwitcher } from '@/components/ui/GruzchikSwitcher';
import Header from '@/components/ui/Header';
import BottomNavigation from '@/components/ui/BottomNavigation';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { SearchProvider } from '@/contexts/SearchContext';
import { NextAuthUserProvider } from '@/contexts/NextAuthUserContext';
import { ClientChatProvider } from '@/contexts/ClientChatContext';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextAuthUserProvider>
      <ThemeProvider>
        <SearchProvider>
          <ClientChatProvider>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-blue-600 focus:px-3 focus:py-2 focus:text-white"
            >
              Пропустить к содержимому
            </a>
            <div className="mobile-layout flex min-h-screen flex-col md:!h-auto md:!overflow-visible">
              <Header />
              <main className="flex-1 pb-20 md:pb-0">
                <div id="main-content" className="min-h-0">
                  {children}
                </div>
              </main>
              <div className="hidden md:block">
                <Footer />
              </div>
              {/* Bottom Navigation - visible on tablet and mobile */}
              <div className="md:hidden">
                <BottomNavigation />
              </div>
              {/* Portal Switchers for role-based access */}
              <AdminSwitcher />
              <GruzchikSwitcher />
            </div>
          </ClientChatProvider>
        </SearchProvider>
      </ThemeProvider>
    </NextAuthUserProvider>
  );
}
