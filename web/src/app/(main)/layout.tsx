import Footer from '@/components/ui/Footer';
import Header from '@/components/ui/Header';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { AdminSwitcher } from '@/components/ui/AdminSwitcher';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-blue-600 focus:px-3 focus:py-2 focus:text-white"
      >
        Пропустить к содержимому
      </a>
      <div className="bg-background text-foreground flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div id="main-content">{children}</div>
        </main>
        <Footer />
        <AdminSwitcher />
      </div>
    </ThemeProvider>
  );
}
