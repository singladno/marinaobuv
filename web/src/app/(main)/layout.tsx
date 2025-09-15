import Footer from '@/components/ui/Footer';
import Header from '@/components/ui/Header';
import { AdminSwitcher } from '@/components/ui/AdminSwitcher';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-blue-600 focus:px-3 focus:py-2 focus:text-white"
      >
        Пропустить к содержимому
      </a>
      <div className="bg-background text-foreground flex h-dvh min-h-0 flex-col">
        <Header />
        <main className="min-h-0 flex-1 overflow-hidden">
          <div id="main-content" className="h-full min-h-0">
            {children}
          </div>
        </main>
        <Footer />
        <AdminSwitcher />
      </div>
    </>
  );
}
