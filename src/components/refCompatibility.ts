import {
	Children,
	Fragment,
	isValidElement,
	type ReactNode,
	version,
} from "react";

const FORWARD_REF_SYMBOL = Symbol.for("react.forward_ref");
const MEMO_SYMBOL = Symbol.for("react.memo");

export interface ShouldUseWrapperOptions {
	reactMajorVersion?: number;
}

function getReactMajorVersion(): number {
	return Number.parseInt(version.split(".")[0] ?? "18", 10);
}

function canAttachRefToType(type: unknown, reactMajorVersion: number): boolean {
	if (typeof type === "string") {
		return true;
	}

	if (typeof type === "function") {
		const isClassComponent = Boolean(
			(type as { prototype?: { isReactComponent?: unknown } }).prototype
				?.isReactComponent,
		);
		return isClassComponent || reactMajorVersion >= 19;
	}

	if (typeof type === "object" && type != null) {
		const tagged = type as { $$typeof?: symbol; type?: unknown };
		if (tagged.$$typeof === FORWARD_REF_SYMBOL) {
			return true;
		}
		if (tagged.$$typeof === MEMO_SYMBOL) {
			return canAttachRefToType(tagged.type, reactMajorVersion);
		}
	}

	return false;
}

export function shouldUseWrapper(
	children: ReactNode,
	options: ShouldUseWrapperOptions = {},
): boolean {
	const reactMajorVersion = options.reactMajorVersion ?? getReactMajorVersion();

	try {
		const child = Children.only(children);
		if (!isValidElement(child)) {
			return true;
		}
		if (child.type === Fragment) {
			return true;
		}
		return !canAttachRefToType(child.type, reactMajorVersion);
	} catch {
		return true;
	}
}
