'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { useWhatsAppInbox } from '@/contexts/WhatsAppInboxContext';
import {
  orbitIconAdmin,
  orbitIconClient,
  orbitIconWhatsApp,
} from '@/components/ui/portal-orbit-styles';
import { PortalRadialWheelBg } from '@/components/ui/PortalRadialWheelBg';
import { PortalRadialSlots } from '@/components/ui/PortalRadialSlots';
import { useUser } from '@/contexts/NextAuthUserContext';
import { useAdminChat } from '@/contexts/AdminChatContext';
import { useClientChat } from '@/contexts/ClientChatContext';
import { usePortalOrbitHover } from '@/hooks/usePortalOrbitHover';

const ORBIT_RADIUS = 112;

export function PortalSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { isOpen: whatsAppOpen, openInbox } = useWhatsAppInbox();
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { isAdminChatOpen } = useAdminChat();
  const { isClientChatOpen } = useClientChat();
  const { activeOrbitIndex, enterOrbit, leaveOrbit, resetOrbit } =
    usePortalOrbitHover();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, [pathname]);

  const toggleMenu = () => setIsOpen(!isOpen);

  useEffect(() => {
    if (!isOpen) resetOrbit();
  }, [isOpen, resetOrbit]);

  const closeMenu = useCallback(() => setIsOpen(false), []);

  const openWhatsApp = useCallback(() => {
    openInbox();
    setIsOpen(false);
  }, [openInbox]);

  const navigatePrimaryPortal = useCallback(() => {
    closeMenu();
    const href = pathname.startsWith('/admin')
      ? '/'
      : user?.role === 'EXPORT_MANAGER'
        ? '/admin/exports'
        : '/admin';
    router.push(href);
  }, [closeMenu, pathname, router, user?.role]);

  const menuSlots = useMemo(() => {
    const slots: React.ReactNode[] = [];

    const whatsAppBtn =
      user?.role === 'ADMIN' ? (
        <button
          key="wa"
          type="button"
          onClick={openWhatsApp}
          className={orbitIconWhatsApp}
          title="WhatsApp"
          aria-label="Открыть WhatsApp чаты"
        >
          <WhatsAppGlyph className="h-6 w-6" />
        </button>
      ) : null;

    if (pathname.startsWith('/admin')) {
      slots.push(
        <Link
          key="client"
          href="/"
          onClick={closeMenu}
          className={orbitIconClient}
          title="Клиентский портал"
          aria-label="Перейти в клиентский портал"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.25}
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </Link>
      );
      if (whatsAppBtn) slots.push(whatsAppBtn);
    } else {
      slots.push(
        <Link
          key="admin"
          href={user?.role === 'EXPORT_MANAGER' ? '/admin/exports' : '/admin'}
          onClick={closeMenu}
          className={orbitIconAdmin}
          title={
            user?.role === 'EXPORT_MANAGER' ? 'Панель экспорта' : 'Админ панель'
          }
          aria-label={
            user?.role === 'EXPORT_MANAGER'
              ? 'Перейти в панель экспорта'
              : 'Перейти в админ панель'
          }
        >
          <svg
            className="h-6 w-6 stroke-white text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.25}
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </Link>
      );
      if (whatsAppBtn) slots.push(whatsAppBtn);
    }

    return slots;
  }, [pathname, user?.role, closeMenu, openWhatsApp]);

  const wheelTopLabel = pathname.startsWith('/admin')
    ? 'Перейти в клиентский портал'
    : user?.role === 'EXPORT_MANAGER'
      ? 'Панель экспорта'
      : 'Админ панель';
  const wheelLeftLabel =
    user?.role === 'ADMIN'
      ? 'Открыть WhatsApp чаты'
      : user?.role === 'EXPORT_MANAGER'
        ? 'Панель экспорта'
        : undefined;

  const onWheelTop = navigatePrimaryPortal;
  const onWheelLeft =
    user?.role === 'ADMIN'
      ? openWhatsApp
      : user?.role === 'EXPORT_MANAGER'
        ? navigatePrimaryPortal
        : undefined;

  if (!isVisible) return null;
  if (user?.role !== 'ADMIN' && user?.role !== 'EXPORT_MANAGER') return null;
  if (isAdminChatOpen || isClientChatOpen) return null;

  return (
    <>
      {/* Dim layer — stays *under* the orbit UI */}
      {isOpen && !whatsAppOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-[3px]"
          onClick={closeMenu}
          aria-label="Закрыть меню"
        />
      )}

      <div className="pointer-events-none fixed bottom-4 right-4 z-[130] hidden sm:bottom-6 sm:right-6 md:block">
        <div className="pointer-events-auto relative h-12 w-12 overflow-visible sm:h-14 sm:w-14">
          {menuSlots.length > 0 && (
            <PortalRadialWheelBg
              open={isOpen && !whatsAppOpen}
              onTopSectorClick={onWheelTop}
              onLeftSectorClick={onWheelLeft}
              topSectorLabel={wheelTopLabel}
              leftSectorLabel={wheelLeftLabel}
              leftSectorMapsToIndex={menuSlots.length >= 2 ? 1 : 0}
              activeOrbitIndex={activeOrbitIndex}
              onTopSectorPointerEnter={() => enterOrbit(0)}
              onLeftSectorPointerEnter={() =>
                enterOrbit(menuSlots.length >= 2 ? 1 : 0)
              }
              onSectorPointerLeave={leaveOrbit}
            />
          )}

          <PortalRadialSlots
            open={isOpen}
            radius={ORBIT_RADIUS}
            placement="bottomRightLeftUp"
            items={menuSlots}
            activeOrbitIndex={activeOrbitIndex}
            onOrbitEnter={enterOrbit}
            onOrbitLeave={leaveOrbit}
          />

          <button
            type="button"
            onClick={toggleMenu}
            className="relative z-[28] flex h-full w-full cursor-pointer items-center justify-center rounded-full border-2 border-transparent text-white shadow-none transition-all duration-300 [background-clip:padding-box,border-box] [background-image:linear-gradient(to_right,#ea34ea,#6d28d9),linear-gradient(to_bottom_right,rgb(255_255_255/0.42),rgb(255_255_255/0.14))] [background-origin:border-box] hover:scale-110 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Меню портала"
            aria-expanded={isOpen ? 'true' : 'false'}
          >
            <div className="relative z-10">
              {isOpen ? (
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              )}
            </div>
          </button>

          <div className="absolute -right-1 -top-1 z-[45] flex h-5 w-5 items-center justify-center rounded-full border border-white/30 bg-violet-900/90 text-[10px] font-bold text-white shadow-md sm:-right-2 sm:-top-2 sm:h-6 sm:w-6 sm:text-xs">
            {pathname.startsWith('/admin') ? 'A' : 'C'}
          </div>
        </div>
      </div>
    </>
  );
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
