// 외부 의존성 없는 최소 마크다운 렌더러 (제목, 굵게, 목록, 문단)
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(s: string): string {
  return escapeHtml(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

export function renderMarkdown(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let list: string[] | null = null;
  let ordered = false;

  const flushList = () => {
    if (list) {
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag}>${list.map((li) => `<li>${li}</li>`).join("")}</${tag}>`);
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    const ul = line.match(/^[-*]\s+(.*)$/);
    const ol = line.match(/^\d+[.)]\s+(.*)$/);
    if (h) {
      flushList();
      const level = Math.min(h[1].length + 1, 4); // # → h2
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
    } else if (ul) {
      if (list && ordered) flushList();
      ordered = false;
      (list ??= []).push(inline(ul[1]));
    } else if (ol) {
      if (list && !ordered) flushList();
      ordered = true;
      (list ??= []).push(inline(ol[1]));
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  flushList();
  return out.join("\n");
}
