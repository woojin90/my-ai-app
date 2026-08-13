import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Claude 응답에는 **굵게**, 목록, 코드 블록 같은 마크다운 문법이 자주 포함된다.
// react-markdown으로 실제 서식으로 변환해서 보여준다.
export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div
      className="prose prose-sm max-w-none break-words text-zinc-900 dark:prose-invert
        prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0
        prose-pre:my-2 prose-pre:bg-zinc-950 prose-pre:text-zinc-100
        prose-code:before:content-none prose-code:after:content-none"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
