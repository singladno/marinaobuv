import Header from '@/components/ui/Header';
import BottomNavigation from '@/components/ui/BottomNavigation';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { SearchProvider } from '@/contexts/SearchContext';
import { NextAuthUserProvider } from '@/contexts/NextAuthUserContext';
import { ClientChatProvider } from '@/contexts/ClientChatContext';
import { SwitcherProvider } from '@/contexts/SwitcherContext';

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
            <SwitcherProvider>
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
                {/* Bottom Navigation - visible on tablet and mobile */}
                <div className="md:hidden">
                  <BottomNavigation />
                </div>
                {/* Scroll arrows are rendered per-page where needed */}
              </div>
            </SwitcherProvider>
          </ClientChatProvider>
        </SearchProvider>
      </ThemeProvider>
    </NextAuthUserProvider>
  );
}
