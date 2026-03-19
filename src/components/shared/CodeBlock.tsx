'use client';

import { useEffect, useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export default function CodeBlock({ code, language = 'json' }: CodeBlockProps) {
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    import('shiki').then(({ codeToHtml }) => {
      codeToHtml(code, {
        lang: language,
        theme: 'vitesse-dark',
      }).then((result) => {
        if (!cancelled) setHtml(result);
      });
    });
    return () => { cancelled = true; };
  }, [code, language]);

  if (!html) {
    return (
      <pre className="bg-bg rounded p-3 text-xs text-muted overflow-auto">
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <div
      className="rounded overflow-auto text-xs [&_pre]:!bg-bg [&_pre]:p-3"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
