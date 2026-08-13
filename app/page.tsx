"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { MarkdownMessage } from "./components/MarkdownMessage";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const MAX_TEXTAREA_HEIGHT = 160;

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 메시지가 추가되거나 스트리밍으로 내용이 길어질 때마다 맨 아래로 스크롤한다.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  // 입력창을 비우면(전송 후, 새 대화 시작 등) textarea 높이도 원래대로 되돌린다.
  useEffect(() => {
    if (input === "" && textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input]);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];

    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "알 수 없는 오류가 발생했습니다.");
        return;
      }

      if (!res.body) {
        setError("응답을 받지 못했습니다.");
        return;
      }

      // 스트리밍으로 글자가 채워질 빈 assistant 메시지를 먼저 추가해 둔다.
      setMessages([...nextMessages, { role: "assistant", content: "" }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // 방금 추가한 마지막 assistant 메시지에 도착한 조각을 이어 붙인다.
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          updated[updated.length - 1] = {
            ...last,
            content: last.content + chunk,
          };
          return updated;
        });
      }
    } catch {
      setError("네트워크 오류로 응답을 받지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  function resetConversation() {
    setMessages([]);
    setInput("");
    setError(null);
    textareaRef.current?.focus();
  }

  function handleInputChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);

    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter로 전송, Shift+Enter로 줄바꿈
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center px-4 py-8">
      <div className="flex w-full max-w-2xl flex-1 flex-col">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            나의 첫 AI 앱
          </h1>
          <button
            onClick={resetConversation}
            disabled={isLoading || messages.length === 0}
            className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600
              transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40
              dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            새 대화
          </button>
        </div>

        <div
          className="flex flex-1 flex-col gap-4 overflow-y-auto rounded-lg border border-zinc-200
            bg-white/90 p-4 shadow-sm backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/90"
        >
          {messages.length === 0 && (
            <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
              메시지를 입력해서 대화를 시작해 보세요.
            </p>
          )}

          {messages.map((message, index) => {
            // 스트리밍이 막 시작돼 아직 글자가 도착하지 않은 빈 assistant
            // 메시지는 말풍선 대신 아래의 "생각 중..." 표시로 대체한다.
            if (message.role === "assistant" && message.content === "") {
              return null;
            }

            const isUser = message.role === "user";

            return (
              <div
                key={index}
                className={`flex items-end gap-2 ${
                  isUser ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base ${
                    isUser
                      ? "bg-blue-600"
                      : "bg-zinc-200 dark:bg-zinc-700"
                  }`}
                >
                  {isUser ? "🧑" : "🤖"}
                </div>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    isUser
                      ? "whitespace-pre-wrap bg-blue-600 text-white"
                      : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                  }`}
                >
                  {isUser ? message.content : <MarkdownMessage content={message.content} />}
                </div>
              </div>
            );
          })}

          {isLoading &&
            (() => {
              const last = messages[messages.length - 1];
              const waitingForFirstChunk =
                !last || last.role !== "assistant" || last.content === "";

              if (!waitingForFirstChunk) return null;

              return (
                <div className="flex items-end gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-base dark:bg-zinc-700">
                    🤖
                  </div>
                  <div className="max-w-[75%] rounded-2xl bg-zinc-100 px-4 py-2 text-sm text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    생각 중...
                  </div>
                </div>
              );
            })()}

          <div ref={bottomRef} />
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-950/60 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="mt-4 flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="메시지를 입력하세요 (Shift+Enter로 줄바꿈)"
            rows={1}
            className="max-h-40 flex-1 resize-none rounded-2xl border border-zinc-300 bg-white px-4 py-2
              text-sm outline-none focus:border-blue-500 disabled:opacity-50
              dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors
              hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}
