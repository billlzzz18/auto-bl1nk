import { codeToHtml } from 'shiki';

const SUPPORTED_LANGUAGES = [
  'typescript', 'javascript', 'jsx', 'tsx',
  'python', 'java', 'go', 'rust',
  'css', 'html', 'sql', 'bash',
  'json', 'yaml', 'markdown', 'xml'
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export async function highlightCode(
  code: string,
  language: SupportedLanguage = 'typescript'
): Promise<string> {
  try {
    const html = await codeToHtml(code, {
      lang: language,
      theme: 'github-dark',
    });
    return html;
  } catch (error) {
    console.error('Code highlighting failed:', error);
    return `<pre><code>${escapeHtml(code)}</code></pre>`;
  }
}

export async function highlightCodeInline(code: string): Promise<string> {
  try {
    const html = await codeToHtml(code, {
      lang: 'typescript',
      theme: 'github-dark',
    });
    return html;
  } catch {
    return `<code>${escapeHtml(code)}</code>`;
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

export async function highlightMarkdownCode(markdown: string): Promise<string> {
  // Replace code blocks with syntax-highlighted versions
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

  let result = markdown;
  const matches = Array.from(markdown.matchAll(codeBlockRegex));

  for (const match of matches) {
    const language = match[1] as SupportedLanguage || 'typescript';
    const code = match[2];
    const highlighted = await highlightCode(code, language);
    result = result.replace(match[0], highlighted);
  }

  return result;
}
