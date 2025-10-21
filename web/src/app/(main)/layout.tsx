import { AdminSwitcher } from '@/components/ui/AdminSwitcher';
import Footer from '@/components/ui/Footer';
import { GruzchikSwitcher } from '@/components/ui/GruzchikSwitcher';
import Header from '@/components/ui/Header';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { SearchProvider } from '@/contexts/SearchContext';
import { UserProvider } from '@/contexts/UserContext';
import { ClientChatProvider } from '@/contexts/ClientChatContext';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <ThemeProvider>
        <SearchProvider>
          <ClientChatProvider>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-blue-600 focus:px-3 focus:py-2 focus:text-white"
            >
              Пропустить к содержимому
            </a>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">
                <div id="main-content">{children}</div>
              </main>
              <Footer />
              {/* Portal Switchers for role-based access */}
              <AdminSwitcher />
              <GruzchikSwitcher />
            </div>
          </ClientChatProvider>
        </SearchProvider>
      </ThemeProvider>
    </UserProvider>
  );
}
