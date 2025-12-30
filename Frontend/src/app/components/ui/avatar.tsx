import Image from "next/image";
import React from "react";
import { motion } from "framer-motion";

type AvatarProps = {
	src?: string | null;
	name?: string | null;
	size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
	alt?: string;
	status?: "online" | "away" | "busy" | "offline" | null;
	className?: string;
};

const sizeClassMap: Record<string, string> = {
	xs: "h-6 w-6 text-xs",
	sm: "h-8 w-8 text-sm",
	md: "h-10 w-10 text-sm",
	lg: "h-12 w-12 text-base",
	xl: "h-14 w-14 text-lg",
};

function getInitials(name?: string | null) {
	if (!name) return "?";
	const parts = name.trim().split(/\s+/);
	const initials = parts.length === 1 ? parts[0].slice(0, 2) : (parts[0][0] + parts[parts.length - 1][0]);
	return initials.toUpperCase();
}

export default function Avatar({ src = null, name = null, size = "sm", alt, status = null, className = "" }: AvatarProps) {
	const sizeKey = typeof size === "number" ? null : (size || "sm");
	const sizeClass = typeof size === "number" ? `h-[${size}px] w-[${size}px]` : sizeClassMap[sizeKey as string] || sizeClassMap.sm;

	const statusColor = status === "online" ? "bg-green-400" : status === "away" ? "bg-yellow-400" : status === "busy" ? "bg-red-400" : "bg-gray-400";

	return (
		<motion.div
			initial={{ scale: 0.9, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			transition={{ type: "spring", stiffness: 300, damping: 20 }}
			whileHover={{ scale: 1.05, rotate: 2 }}
			whileTap={{ scale: 0.98 }}
			className={`relative inline-flex items-center ${className}`}
			aria-label={name ? `${name} avatar` : "user avatar"}
			role="img"
		>
			{src ? (
				<div className={`overflow-hidden rounded-full ${sizeClass} bg-gray-100 dark:bg-gray-800`}>
					<Image src={src} alt={alt || name || "avatar"} width={40} height={40} className="object-cover" />
				</div>
			) : (
				<div className={`flex items-center justify-center rounded-full ${sizeClass} bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100 font-medium`}>
					<span className="select-none">{getInitials(name)}</span>
				</div>
			)}

			{/* status badge */}
			{status && (
				<span className={`absolute -bottom-0.5 -right-0.5 block h-3 w-3 rounded-full ring-2 ring-white dark:ring-gray-900 ${statusColor}`} aria-hidden="true" />
			)}
		</motion.div>
	);
}

