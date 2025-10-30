'use client';

import { ArrowDown, ArrowUp } from 'lucide-react';
import { useScrollArrows } from '@/hooks/useScrollArrows';

interface ScrollArrowsProps {
	className?: string;
	// Allow tweaking thresholds per page if needed
	showUpAfterPx?: number;
	bottomThresholdPx?: number;
	// Visual offsets to avoid overlapping with other FABs/switchers
	offsetBottomPx?: number; // will add env(safe-area-inset-bottom)
	offsetRightPx?: number;
  showOnMobile?: boolean;
  // CSS selector for custom scroll container (optional)
  containerSelector?: string;
}

export function ScrollArrows({
	className = '',
	showUpAfterPx,
	bottomThresholdPx,
	offsetBottomPx = 160,
	offsetRightPx = 20,
  showOnMobile = false,
  containerSelector,
}: ScrollArrowsProps) {
	const container = typeof window !== 'undefined' && containerSelector
		? (document.querySelector(containerSelector) as HTMLElement | null)
		: null;
	const { showUp, showDown, scrollToTop, scrollToBottom } = useScrollArrows({
		showUpAfterPx,
		bottomThresholdPx,
		container,
	});

	return (
		<div
			className={`pointer-events-none fixed z-[100] ${showOnMobile ? 'flex' : 'hidden md:flex'} flex-col items-center gap-2 ${className}`}
			style={{
				right: `${offsetRightPx}px`,
				bottom: `calc(env(safe-area-inset-bottom, 0px) + ${offsetBottomPx}px)`,
			}}
		>
			{showDown && (
				<button
					aria-label="Вниз"
					onClick={scrollToBottom}
					className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-purple-600 text-white shadow-lg transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer"
					type="button"
				>
					<ArrowDown className="h-4 w-4" />
				</button>
			)}
			{showUp && (
				<button
					aria-label="Вверх"
					onClick={scrollToTop}
					className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-purple-600 text-white shadow-lg transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer"
					type="button"
				>
					<ArrowUp className="h-4 w-4" />
				</button>
			)}
		</div>
	);
}

export default ScrollArrows;
