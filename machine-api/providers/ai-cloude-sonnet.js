/* List Model Available 
[
  "openai/gpt-5.5",
  "openai/gpt-5.4",
  "openai/gpt-5.3-chat",
  "openai/gpt-5.1-instant",
  "openai/gpt-5",
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
  "xai/grok-4.1-fast-non-reasoning",
  "anthropic/claude-haiku-4.5",
  "anthropic/claude-sonnet-4.6",
  "anthropic/claude-opus-4.5",
  "anthropic/claude-opus-4.6",
  "anthropic/claude-opus-4.7",
  "anthropic/claude-opus-4.8",
  "anthropic/claude-fable-5",
  "deepseek/deepseek-v4-pro",
  "deepseek/deepseek-v4-flash",
  "deepseek/deepseek-v3.2-thinking",
  "google/gemini-3.1-pro-preview",
  "google/gemini-3-pro-preview",
  "google/gemini-3.1-flash-lite",
  "alibaba/qwen3-max",
  "meta/llama-4-maverick",
  "moonshotai/kimi-k2.6"
];
*/

import crypto from 'node:crypto';

const base_url = 'https://www.chatday.ai';

const baseHeaders = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
  'Origin': base_url,
  'Referer': `${base_url}/chat`,
};

async function signInAnonymous() {
  const r = await fetch(`${base_url}/api/auth/sign-in/anonymous`, {
    method: 'POST',
    headers: { ...baseHeaders, 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!r.ok) return;

  const setCookie = r.headers.getSetCookie?.() ?? [r.headers.get('set-cookie')].filter(Boolean);
  const cookie = setCookie.map(c => c.split(';')[0]).join('; ');

  const data = await r.json();
  return { cookie, token: data.token, user: data.user };
}

async function chat(prompt, model = 'openai/gpt-5.5') {
  const { cookie } = await signInAnonymous();

  const visitorId = crypto.randomUUID().replace(/-/g, '');
  const conversationId = Math.random().toString(36).slice(2, 10).toUpperCase() + Math.random().toString(36).slice(2, 10).toUpperCase();

  const r = await fetch(`${base_url}/api/v2/chat/anonymous`, {
    method: 'POST',
    headers: {
      ...baseHeaders,
      'Content-Type': 'application/json',
      'Cookie': cookie,
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify({ content: prompt, model, visitorId, conversationId }),
  });

  if (!r.ok) return;

  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let full = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    const lines = buf.split('\n');
    buf = lines.pop();

    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      try {
        const evt = JSON.parse(payload);
        if (evt.type === 'text-delta' && typeof evt.delta === 'string') {
          full += evt.delta;
        }
      } catch {}
    }
  }
  return { status: 200, model: model, result: full };
}

module.exports = { signInAnonymous, chat };
