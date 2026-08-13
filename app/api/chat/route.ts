import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "메시지가 비어 있습니다." },
        { status: 400 }
      );
    }

    const response = await anthropic.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      messages,
    });

    const textBlock = response.content.find((block) => block.type === "text");

    if (response.stop_reason === "refusal" || !textBlock) {
      return NextResponse.json(
        { error: "응답을 생성할 수 없습니다. 다른 질문을 시도해 주세요." },
        { status: 422 }
      );
    }

    return NextResponse.json({ text: textBlock.text });
  } catch (error) {
    console.error("Anthropic API error:", error);
    return NextResponse.json(
      { error: "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
