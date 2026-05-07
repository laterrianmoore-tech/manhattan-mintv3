import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from '@/lib/chat-system-prompt';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const maxDuration = 60;

const SUBMIT_LEAD_TOOL: Anthropic.Tool = {
  name: 'submit_lead',
  description:
    'Submit the qualified lead to the Manhattan Mint team. Call once per conversation when name, email, and phone have been collected.',
  input_schema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      email: { type: 'string' },
      phone: { type: 'string' },
      neighborhood: { type: 'string' },
      size: { type: 'string', description: 'e.g. studio, 2BR, etc.' },
      type_of_clean: { type: 'string' },
      preferred_timing: { type: 'string' },
      summary: { type: 'string', description: '1-2 sentence summary of the conversation' },
    },
    required: ['name', 'email', 'phone', 'summary'],
  },
};

export async function POST(req: NextRequest) {
  let messages: Anthropic.MessageParam[];
  try {
    const body = await req.json();
    if (!Array.isArray(body.messages)) throw new Error('messages must be an array');
    messages = body.messages;
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? 'Bad request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = req.headers.get('host') ?? 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await streamTurn(messages, controller, encoder, baseUrl);
        controller.close();
      } catch (e) {
        console.error('Chat stream error:', e);
        controller.error(e);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}

async function streamTurn(
  messages: Anthropic.MessageParam[],
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  baseUrl: string,
  depth = 0,
): Promise<void> {
  if (depth > 3) return;

  const sdkStream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: buildSystemPrompt(),
    messages,
    tools: [SUBMIT_LEAD_TOOL],
  });

  sdkStream.on('text', (text) => {
    controller.enqueue(encoder.encode(text));
  });

  const message = await sdkStream.finalMessage();

  if (message.stop_reason === 'tool_use') {
    const toolBlock = message.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    );

    if (toolBlock?.name === 'submit_lead') {
      try {
        await fetch(`${baseUrl}/api/leads/from-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toolBlock.input),
        });
      } catch (e) {
        console.error('Lead submission error:', e);
      }

      await streamTurn(
        [
          ...messages,
          { role: 'assistant' as const, content: message.content },
          {
            role: 'user' as const,
            content: [
              {
                type: 'tool_result' as const,
                tool_use_id: toolBlock.id,
                content: 'Lead submitted successfully.',
              },
            ],
          },
        ],
        controller,
        encoder,
        baseUrl,
        depth + 1,
      );
    }
  }
}
