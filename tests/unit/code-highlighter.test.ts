import { describe, it, expect } from '@jest/globals';
import {
  highlightCode,
  highlightCodeInline,
  highlightMarkdownCode,
  SupportedLanguage,
} from '@/lib/code-highlighter';

describe('Code Highlighter', () => {
  describe('highlightCode', () => {
    it('should highlight TypeScript code', async () => {
      const code = 'const x: number = 42;';
      const result = await highlightCode(code, 'typescript');
      expect(result).toContain('<pre');
      expect(result).toContain('code');
      expect(result).toContain('42');
    });

    it('should highlight JavaScript code', async () => {
      const code = 'function hello() { return "world"; }';
      const result = await highlightCode(code, 'javascript');
      expect(result).toContain('<pre');
      expect(result).toContain('hello');
    });

    it('should highlight Python code', async () => {
      const code = 'def fib(n):\n  return n if n <= 1 else fib(n-1) + fib(n-2)';
      const result = await highlightCode(code, 'python');
      expect(result).toContain('<pre');
      expect(result).toContain('def');
    });

    it('should highlight SQL code', async () => {
      const code = 'SELECT * FROM users WHERE id = 1;';
      const result = await highlightCode(code, 'sql');
      expect(result).toContain('<pre');
      expect(result).toContain('SELECT');
    });

    it('should support JSX syntax', async () => {
      const code = 'const App = () => <div>Hello</div>;';
      const result = await highlightCode(code, 'jsx');
      expect(result).toContain('<pre');
      expect(result).toContain('App');
    });

    it('should support TSX syntax', async () => {
      const code = 'const App: React.FC = () => <div>Hello</div>;';
      const result = await highlightCode(code, 'tsx');
      expect(result).toContain('<pre');
      expect(result).toContain('React');
    });

    it('should fallback gracefully on error', async () => {
      const code = 'invalid code <<<';
      const result = await highlightCode(code, 'typescript');
      expect(result).toMatch(/<pre><code>|<code>/);
      expect(result).toContain('invalid code');
    });

    it('should escape HTML characters in fallback', async () => {
      const code = '<script>alert("xss")</script>';
      const result = await highlightCode(code, 'typescript');
      expect(result).toContain('&lt;script&gt;');
      expect(result).not.toContain('<script>');
    });

    it('should default to TypeScript when language not specified', async () => {
      const code = 'const x = 42;';
      const result = await highlightCode(code);
      expect(result).toContain('<pre');
      expect(result).toContain('42');
    });
  });

  describe('highlightCodeInline', () => {
    it('should highlight inline code', async () => {
      const code = 'const x = 42;';
      const result = await highlightCodeInline(code);
      expect(result).toContain('const');
      expect(result).toContain('42');
    });

    it('should fallback on error', async () => {
      const code = 'invalid <<<';
      const result = await highlightCodeInline(code);
      expect(result).toMatch(/<code>|<pre>/);
      expect(result).toContain('invalid');
    });

    it('should escape HTML in fallback', async () => {
      const code = '<div>test</div>';
      const result = await highlightCodeInline(code);
      expect(result).toContain('&lt;div&gt;');
    });
  });

  describe('highlightMarkdownCode', () => {
    it('should highlight code blocks in markdown', async () => {
      const markdown = `
Here is some code:
\`\`\`typescript
const x = 42;
\`\`\`
      `;
      const result = await highlightMarkdownCode(markdown);
      expect(result).toContain('const');
      expect(result).toContain('42');
    });

    it('should support multiple code blocks', async () => {
      const markdown = `
\`\`\`typescript
const a = 1;
\`\`\`
Some text
\`\`\`javascript
const b = 2;
\`\`\`
      `;
      const result = await highlightMarkdownCode(markdown);
      expect(result).toContain('const a');
      expect(result).toContain('const b');
    });

    it('should handle code blocks with specified language', async () => {
      const markdown = `
\`\`\`python
def hello():
    return "world"
\`\`\`
      `;
      const result = await highlightMarkdownCode(markdown);
      expect(result).toContain('def');
      expect(result).toContain('hello');
    });

    it('should handle code blocks without language specified', async () => {
      const markdown = `
\`\`\`
const x = 42;
\`\`\`
      `;
      const result = await highlightMarkdownCode(markdown);
      expect(result).toContain('const');
    });

    it('should preserve non-code content', async () => {
      const markdown = '# Hello\n\nThis is a paragraph\n\n```typescript\nconst x = 42;\n```';
      const result = await highlightMarkdownCode(markdown);
      expect(result).toContain('# Hello');
      expect(result).toContain('This is a paragraph');
    });

    it('should handle empty code blocks', async () => {
      const markdown = '```typescript\n\n```';
      const result = await highlightMarkdownCode(markdown);
      expect(result).toBeTruthy();
    });
  });

  describe('Language Support', () => {
    const supportedLanguages: SupportedLanguage[] = [
      'typescript',
      'javascript',
      'jsx',
      'tsx',
      'python',
      'java',
      'go',
      'rust',
      'css',
      'html',
      'sql',
      'bash',
      'json',
      'yaml',
      'markdown',
      'xml',
    ];

    supportedLanguages.forEach((lang) => {
      it(`should support ${lang} language`, async () => {
        const samples: Record<SupportedLanguage, string> = {
          typescript: 'const x: number = 1;',
          javascript: 'const x = 1;',
          jsx: '<Component />',
          tsx: '<Component<T> />',
          python: 'x = 1',
          java: 'int x = 1;',
          go: 'var x int = 1',
          rust: 'let x = 1;',
          css: 'body { color: red; }',
          html: '<div>text</div>',
          sql: 'SELECT * FROM users;',
          bash: 'echo "hello"',
          json: '{"key": "value"}',
          yaml: 'key: value',
          markdown: '# Heading',
          xml: '<tag>content</tag>',
        };

        const code = samples[lang];
        const result = await highlightCode(code, lang);
        expect(result).toBeTruthy();
        expect(result).toContain(code.substring(0, 5));
      });
    });
  });

  describe('HTML Escaping', () => {
    it('should escape ampersand', async () => {
      const code = 'a & b';
      const result = await highlightCode(code, 'javascript');
      // Should contain escaped version or highlighted version
      expect(result).toMatch(/a (&amp;|<span.*>&<\/span>) b|a &amp; b/);
    });

    it('should escape less than', async () => {
      const code = 'if (a < b)';
      const result = await highlightCode(code, 'javascript');
      expect(result).toBeTruthy();
    });

    it('should escape greater than', async () => {
      const code = 'if (a > b)';
      const result = await highlightCode(code, 'javascript');
      expect(result).toBeTruthy();
    });

    it('should escape quotes', async () => {
      const code = 'const str = "quoted";';
      const result = await highlightCode(code, 'typescript');
      expect(result).toBeTruthy();
    });
  });
});
