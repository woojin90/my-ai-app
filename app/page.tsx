"use client";

import { useState, type KeyboardEvent } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      sendMessage();
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-4 py-8">
      <div className="flex w-full max-w-2xl flex-1 flex-col">
        <h1 className="mb-6 text-center text-2xl font-bold text-zinc-900">
          나의 첫 AI 앱
        </h1>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4">
          {messages.length === 0 && (
            <p className="text-center text-sm text-zinc-400">
              메시지를 입력해서 대화를 시작해 보세요.
            </p>
          )}

          {messages.map((message, index) => {
            // 스트리밍이 막 시작돼 아직 글자가 도착하지 않은 빈 assistant
            // 메시지는 말풍선 대신 아래의 "생각 중..." 표시로 대체한다.
            if (message.role === "assistant" && message.content === "") {
              return null;
            }

            return (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-100 text-zinc-900"
                  }`}
                >
                  {message.content}
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
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl bg-zinc-100 px-4 py-2 text-sm text-zinc-500">
                    생각 중...
                  </div>
                </div>
              );
            })()}
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="메시지를 입력하세요"
            className="flex-1 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}
