import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { ratelimit } from "@/lib/ratelimit";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success, reset } = await ratelimit.limit(ip);

  if (!success) {
    const retryAfterSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const { messages } = await req.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "메시지가 비어 있습니다." }, { status: 400 });
  }

  // 요청 자체는 정상이므로, 이제부터는 실시간으로 조각조각(chunk) 전송하는
  // 스트리밍 응답을 만든다. 에러가 스트리밍 도중 발생하면 이미 200 상태 코드로
  // 응답이 시작된 뒤라 상태 코드를 바꿀 수 없어서, 대신 에러 문구를 본문에 이어 붙인다.
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = anthropic.messages.stream({
          model: "claude-opus-5",
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          messages,
        });

        for await (const event of anthropicStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        const finalMessage = await anthropicStream.finalMessage();
        if (finalMessage.stop_reason === "refusal") {
          controller.enqueue(
            encoder.encode("\n\n[응답을 생성할 수 없습니다. 다른 질문을 시도해 주세요.]")
          );
        }
      } catch (error) {
        console.error("Anthropic API streaming error:", error);
        controller.enqueue(
          encoder.encode("\n\n[오류가 발생했습니다. 잠시 후 다시 시도해 주세요.]")
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
