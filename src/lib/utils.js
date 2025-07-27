import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import confetti from 'canvas-confetti';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}
export function shootConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.72 },
    zIndex: 9999,
    angle: 90,
    colors: ['#8b5cf6', '#6366f1', '#f472b6', '#34d399', '#fbbf24', '#fff'],
  });
}