"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const AI_DEFAULT_WIDTH = 420;
export const AI_MIN_WIDTH = 320;
export const AI_MAX_WIDTH = 680;

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
	id: string;
	role: ChatRole;
	content: string;
	/** Passage the reader highlighted before asking, if any. */
	quote?: string;
	createdAt: number;
};

type AIPanelState = {
	isOpen: boolean;
	width: number;
	/** Which post the current thread belongs to. */
	slug: string | null;
	messages: ChatMessage[];
	isStreaming: boolean;
	/** Text the reader selected in the article, pending a question. */
	pendingQuote: string | null;

	open: () => void;
	close: () => void;
	toggle: () => void;
	setWidth: (width: number) => void;

	setSlug: (slug: string) => void;
	setPendingQuote: (quote: string | null) => void;
	addMessage: (message: Omit<ChatMessage, "id" | "createdAt">) => string;
	/** Appends a token to a message that is still streaming. */
	appendToMessage: (id: string, token: string) => void;
	replaceMessage: (id: string, content: string) => void;
	setStreaming: (streaming: boolean) => void;
	reset: () => void;
};

let counter = 0;
const nextId = () => `m${Date.now().toString(36)}${(counter++).toString(36)}`;

export const useAIPanelStore = create<AIPanelState>()(
	persist(
		(set) => ({
			// Open by default. The panel is the point of the page, not a utility
			// hidden behind a button, so it is present until someone closes it.
			isOpen: true,
			width: AI_DEFAULT_WIDTH,
			slug: null,
			messages: [],
			isStreaming: false,
			pendingQuote: null,

			open: () => set({ isOpen: true }),
			close: () => set({ isOpen: false }),
			toggle: () => set((s) => ({ isOpen: !s.isOpen })),
			setWidth: (width) =>
				set({
					width: Math.min(Math.max(width, AI_MIN_WIDTH), AI_MAX_WIDTH),
				}),

			// Moving to a different post starts a different conversation. Carrying
			// the old thread over would let the model answer about the wrong
			// article, which is worse than starting empty.
			setSlug: (slug) =>
				set((s) =>
					s.slug === slug
						? { slug }
						: { slug, messages: [], pendingQuote: null, isStreaming: false }
				),

			setPendingQuote: (pendingQuote) => set({ pendingQuote }),

			addMessage: (message) => {
				const id = nextId();
				set((s) => ({
					messages: [...s.messages, { ...message, id, createdAt: Date.now() }],
				}));
				// Returned so the caller can stream into this exact message.
				return id;
			},

			appendToMessage: (id, token) =>
				set((s) => ({
					messages: s.messages.map((m) =>
						m.id === id ? { ...m, content: m.content + token } : m
					),
				})),

			replaceMessage: (id, content) =>
				set((s) => ({
					messages: s.messages.map((m) => (m.id === id ? { ...m, content } : m)),
				})),

			setStreaming: (isStreaming) => set({ isStreaming }),

			reset: () => set({ messages: [], pendingQuote: null, isStreaming: false }),
		}),
		{
			name: "nj.ai-panel",
			// Only the two preferences persist. Replaying a conversation from
			// localStorage on a page the reader has since navigated away from
			// would resurrect a thread about the wrong post.
			partialize: (s) => ({ isOpen: s.isOpen, width: s.width }),
		}
	)
);
