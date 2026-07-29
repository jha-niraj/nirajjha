"use client";

import {
	AnimatePresence,
	motion,
	useInView,
	useReducedMotion,
	Variants,
} from "framer-motion";
import { useRef } from "react";

interface BlurFadeProps {
	children: React.ReactNode;
	className?: string;
	variant?: {
		hidden: { y: number };
		visible: { y: number };
	};
	duration?: number;
	delay?: number;
	yOffset?: number;
	inView?: boolean;
	inViewMargin?: string;
	blur?: string;
}

const BlurFade = ({
	children,
	className,
	variant,
	duration = 0.4,
	delay = 0,
	yOffset = 6,
	inView = true,
	inViewMargin = "-50px",
	blur = "6px",
}: BlurFadeProps) => {
	const ref = useRef(null);
	const reduced = useReducedMotion();
	const inViewResult = useInView(ref, {
		once: true,
		margin: inViewMargin as any,
	});
	const isInView = !inView || inViewResult;

	// Reduced motion keeps the fade, which is what signals "this arrived", and
	// drops the travel and the blur, which are the parts that cause trouble.
	const defaultVariants: Variants = reduced
		? {
				hidden: { opacity: 0 },
				visible: { opacity: 1 },
			}
		: {
				hidden: { y: yOffset, opacity: 0, filter: `blur(${blur})` },
				// Settles at 0, not -yOffset. Ending on a non-zero offset left every
				// animated block sitting slightly above where the layout put it, and
				// the gap compounded down a page of stacked sections.
				visible: { y: 0, opacity: 1, filter: `blur(0px)` },
			};

	const combinedVariants = variant || defaultVariants;

	return (
		<AnimatePresence>
			<motion.div
				ref={ref}
				initial="hidden"
				animate={isInView ? "visible" : "hidden"}
				exit="hidden"
				variants={combinedVariants}
				transition={{
					delay: 0.04 + delay,
					duration: reduced ? 0.15 : duration,
					ease: "easeOut",
				}}
				className={className}
			>
				{children}
			</motion.div>
		</AnimatePresence>
	);
};

export default BlurFade;
