import Link from "next/link";
import type { ReactNode } from "react";

// Renders [text](/path) markdown-style links inside article body strings so
// blog/case-study data can carry inline internal links.
export function renderInline(text: string): ReactNode {
	const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
	const parts: ReactNode[] = [];
	let last = 0;
	let match: RegExpExecArray | null;
	while ((match = re.exec(text)) !== null) {
		if (match.index > last) parts.push(text.slice(last, match.index));
		parts.push(
			<Link key={match.index} href={match[2]}>
				{match[1]}
			</Link>,
		);
		last = match.index + match[0].length;
	}
	if (last === 0) return text;
	if (last < text.length) parts.push(text.slice(last));
	return parts;
}
