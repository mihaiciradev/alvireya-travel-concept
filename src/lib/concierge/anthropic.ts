import Anthropic from "@anthropic-ai/sdk";
import { UpstreamError, type ModelClient } from "./engine";

function translate(error: unknown): unknown {
  if (error instanceof Anthropic.APIUserAbortError) return error;
  if (error instanceof Anthropic.APIConnectionTimeoutError) return new UpstreamError("timeout", false, true);
  if (error instanceof Anthropic.APIConnectionError) return new UpstreamError("connection", false);
  if (error instanceof Anthropic.APIError) return new UpstreamError(`status ${error.status ?? "stream"}`, false);
  return error;
}

export function anthropicModel(apiKey: string, timeoutMs: number): ModelClient {
  const client = new Anthropic({ apiKey, maxRetries: 0, timeout: timeoutMs });

  return {
    stream({ model, system, messages, maxTokens }, signal) {
      const stream = client.messages.stream(
        {
          model,
          max_tokens: maxTokens,
          system,
          messages,
          thinking: { type: "disabled" },
          output_config: { effort: "low" },
        },
        { signal },
      );

      async function* text() {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") yield event.delta.text;
          }
        } catch (error) {
          throw translate(error);
        }
      }

      return {
        text: text(),
        async final() {
          try {
            const message = await stream.finalMessage();
            const usage = message.usage;
            return {
              inputTokens:
                usage.input_tokens + (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0),
              outputTokens: usage.output_tokens,
              stopReason: message.stop_reason,
            };
          } catch (error) {
            throw translate(error);
          }
        },
      };
    },
  };
}
