import type { ComponentType } from "react";

export interface ReactLoadedConfig {
	enabled?: boolean;
	port?: number;
	outDir?: string;
	allowedHosts?: string[];
}

export type Distribution = { avg: number; dev: number };

export interface PersistedSkeletonSnapshot {
	v?: number;
	c?: Record<string, number>;
	w?: Record<string, Record<string, number>>;
	h?: Record<string, Record<string, number>>;
	wd?: Record<string, Record<string, Distribution>>;
	hd?: Record<string, Record<string, Distribution>>;
}

export interface StoragePayload {
	v: 2;
	c: Record<string, number>;
	w: Record<string, Record<string, number>>;
	h: Record<string, Record<string, number>>;
	wd: Record<string, Record<string, Distribution>>;
	hd: Record<string, Record<string, Distribution>>;
}

export interface CapturedNode {
	tag: string;
	className: string;
	style: Record<string, string>;
	attributes: Record<string, string>;
	children: CapturedNode[];
	textContent?: string;
	textAlign?: "left" | "center" | "right";
	rect?: { width: number; height: number };
	nodeType: "layout" | "text" | "media" | "svg" | "interactive";
}

export interface CapturePayload {
	id: string;
	tree: CapturedNode;
	timestamp: number;
}

export type CaptureResult = "no_change" | "updated" | "generated";

// biome-ignore lint/suspicious/noExplicitAny: Registry is a dynamic lookup by string ID — components have heterogeneous props
export type SkeletonRegistry = Record<string, ComponentType<any>>;
