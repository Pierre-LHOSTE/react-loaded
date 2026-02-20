const CONTAINER_ID = "loaded-toast-container";
const STYLE_ID = "loaded-toast-styles";
const activeToasts = new Map<string, HTMLElement>();

function ensureContainer(): HTMLElement {
	if (typeof document === "undefined") return null as never;

	let container = document.getElementById(CONTAINER_ID);
	if (!container) {
		container = document.createElement("div");
		container.id = CONTAINER_ID;
		document.body.appendChild(container);
		injectStyles();
	}
	return container;
}

function injectStyles(): void {
	if (document.getElementById(STYLE_ID)) return;
	const style = document.createElement("style");
	style.id = STYLE_ID;
	style.textContent = `
#${CONTAINER_ID} {
	position: fixed;
	bottom: 16px;
	right: 16px;
	z-index: 99999;
	display: flex;
	flex-direction: column;
	gap: 8px;
	pointer-events: none;
}
.loaded-toast {
	pointer-events: auto;
	display: flex;
	align-items: flex-start;
	gap: 10px;
	padding: 12px 16px;
	border-radius: 10px;
	background: #18181b;
	color: #f4f4f5;
	font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	font-size: 13px;
	line-height: 1.4;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.06);
	animation: loaded-toast-in 0.25s ease-out;
	max-width: 380px;
}
.loaded-toast.loaded-toast-out {
	animation: loaded-toast-out 0.2s ease-in forwards;
}
.loaded-toast-dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	flex-shrink: 0;
	margin-top: 4px;
}
.loaded-toast-info .loaded-toast-dot {
	background: #60a5fa;
	animation: loaded-toast-pulse 1.5s ease-in-out infinite;
}
.loaded-toast-success .loaded-toast-dot {
	background: #34d399;
}
.loaded-toast-body {
	display: flex;
	flex-direction: column;
	gap: 2px;
}
.loaded-toast-msg {
	color: #f4f4f5;
}
.loaded-toast-label {
	color: #a1a1aa;
	font-weight: 600;
}
.loaded-toast-sub {
	color: #71717a;
	font-size: 12px;
}
@keyframes loaded-toast-in {
	from { transform: translateX(calc(100% + 16px)); opacity: 0; }
	to { transform: translateX(0); opacity: 1; }
}
@keyframes loaded-toast-out {
	from { transform: translateX(0); opacity: 1; }
	to { transform: translateX(calc(100% + 16px)); opacity: 0; }
}
@keyframes loaded-toast-pulse {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.4; }
}
`;
	document.head.appendChild(style);
}

function dismissToast(el: HTMLElement, key?: string): void {
	el.classList.add("loaded-toast-out");
	el.addEventListener("animationend", () => el.remove(), { once: true });
	if (key) activeToasts.delete(key);
}

export function dismissByKey(key: string): void {
	const el = activeToasts.get(key);
	if (el) dismissToast(el, key);
}

export function showToast(opts: {
	message: string;
	sub?: string;
	type: "info" | "success";
	duration?: number;
	key?: string;
}): void {
	if (typeof document === "undefined") return;

	// Deduplicate by key — dismiss existing toast with same key
	if (opts.key) {
		const existing = activeToasts.get(opts.key);
		if (existing) dismissToast(existing, opts.key);
	}

	const container = ensureContainer();
	const toast = document.createElement("div");
	toast.className = `loaded-toast loaded-toast-${opts.type}`;
	const dot = document.createElement("span");
	dot.className = "loaded-toast-dot";

	const body = document.createElement("div");
	body.className = "loaded-toast-body";

	const message = document.createElement("div");
	message.className = "loaded-toast-msg";

	const label = document.createElement("span");
	label.className = "loaded-toast-label";
	label.textContent = "react-loaded";
	message.appendChild(label);
	message.appendChild(document.createTextNode(` ${opts.message}`));
	body.appendChild(message);

	if (opts.sub) {
		const sub = document.createElement("div");
		sub.className = "loaded-toast-sub";
		sub.textContent = opts.sub;
		body.appendChild(sub);
	}

	toast.appendChild(dot);
	toast.appendChild(body);

	container.appendChild(toast);

	if (opts.key) activeToasts.set(opts.key, toast);

	const duration = opts.duration ?? (opts.type === "success" ? 6000 : 30000);
	setTimeout(() => dismissToast(toast, opts.key), duration);
}
