import "server-only";
import {
  FinishReason,
  GoogleGenAI,
  Type,
  type Part,
  type Schema,
} from "@google/genai";
import {
  EXTRACTION_SYSTEM_INSTRUCTION,
  GeminiExtractionError,
  getGeminiErrorCategory,
  getGeminiRequestMaxAttempts,
  getGeminiProviderCode,
  getGeminiProviderErrorDetails,
  getGeminiProviderErrorMessage,
  getGeminiProviderErrorStatus,
  getGeminiProviderStatus,
  getSafeGeminiErrorName,
  getSanitizedGeminiErrorMessage,
  resolveGeminiConfiguration,
  retryTransientGeminiRequest,
  runEvidenceExtraction,
  type GeminiProviderDiagnostics,
  type ValidatedEvidenceExtraction,
} from "@/lib/evidence-extraction";

let client: GoogleGenAI | undefined;
let clientApiKey: string | undefined;
let clientTimeoutMs: number | undefined;

export interface GeminiRequestDiagnosticOptions {
  onDiagnostics?: (diagnostics: GeminiProviderDiagnostics) => void;
}

const extractionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    document_type: {
      type: Type.STRING,
      enum: ["github_report", "task_report", "project_report", "screenshot", "other"],
    },
    contributions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          member_identifier: { type: Type.STRING, nullable: true },
          contribution_type: {
            type: Type.STRING,
            enum: ["code", "design", "research", "documentation", "testing", "management", "other"],
          },
          description: { type: Type.STRING },
          evidence_reference: { type: Type.STRING },
          date: { type: Type.STRING, nullable: true },
          confidence: { type: Type.NUMBER, minimum: 0, maximum: 1 },
          uncertainties: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: [
          "member_identifier",
          "contribution_type",
          "description",
          "evidence_reference",
          "date",
          "confidence",
          "uncertainties",
        ],
      },
    },
    unresolved_items: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["summary", "document_type", "contributions", "unresolved_items"],
};

export function getGeminiConfiguration() {
  return resolveGeminiConfiguration({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    GEMINI_REQUEST_TIMEOUT_MS: process.env.GEMINI_REQUEST_TIMEOUT_MS,
  });
}

function getClient(apiKey: string, timeoutMs: number): GoogleGenAI {
  if (!client || clientApiKey !== apiKey || clientTimeoutMs !== timeoutMs) {
    client = new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: timeoutMs,
        retryOptions: { attempts: 1 },
      },
    });
    clientApiKey = apiKey;
    clientTimeoutMs = timeoutMs;
  }
  return client;
}

export async function extractEvidenceWithGemini(input: {
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
  apiKey: string;
  model: string;
  requestTimeoutMs: number;
} & GeminiRequestDiagnosticOptions): Promise<ValidatedEvidenceExtraction> {
  const bytes = input.bytes;
  return runEvidenceExtraction(
    {
      fileName: input.fileName,
      mimeType: input.mimeType,
      bytes,
    },
    async () => {
      const preparationStartedAt = Date.now();
      const requestText = "Analyze the attached evidence document. Extract only completed work supported by the document. Treat all claims as unverified. For every contribution, use an exact identifier only if explicitly present, do not infer identity, and give a page/section/line/commit reference or explicitly state no precise reference could be found. Return dates as YYYY-MM-DD only when the full year, month, and day are explicit and unambiguous; otherwise use null. Use null for unknown identities.";
      const parts: Part[] = [{ text: requestText }];
      if (input.mimeType === "text/plain" || input.mimeType === "text/csv") {
        parts.push({
          text: `BEGIN UNTRUSTED DOCUMENT CONTENT\n${new TextDecoder("utf-8", {
            fatal: true,
          }).decode(bytes)}\nEND UNTRUSTED DOCUMENT CONTENT`,
        });
      } else {
        parts.push({
          inlineData: {
            mimeType: input.mimeType,
            data: Buffer.from(bytes).toString("base64"),
          },
        });
      }
      const requestPreparationMs = Date.now() - preparationStartedAt;
      const requestStartedAt = Date.now();
      let retryCount = 0;
      try {
        const { value: response, retryCount: retries } =
          await retryTransientGeminiRequest(
            () =>
              getClient(input.apiKey, input.requestTimeoutMs).models.generateContent({
                model: input.model,
                contents: [{ role: "user", parts }],
                config: {
                  systemInstruction: EXTRACTION_SYSTEM_INSTRUCTION,
                  responseMimeType: "application/json",
                  responseSchema: extractionSchema,
                  temperature: 0,
                  maxOutputTokens: 8192,
                },
              }),
            {
              maxAttempts: getGeminiRequestMaxAttempts(input.requestTimeoutMs),
              onRetry: (completedRetries) => {
                retryCount = completedRetries;
              },
            }
          );
        retryCount = retries;
        input.onDiagnostics?.({
          requestPreparationMs,
          durationMs: Date.now() - requestStartedAt,
          retryCount,
          providerStatus: null,
          providerCode: null,
          providerErrorMessage: null,
          providerErrorStatus: null,
          providerErrorDetails: [],
          errorName: null,
          sanitizedMessage: null,
        });

        const finishReason = response.candidates?.[0]?.finishReason;
        if (
          response.promptFeedback?.blockReason ||
          finishReason === FinishReason.SAFETY ||
          finishReason === FinishReason.PROHIBITED_CONTENT ||
          finishReason === FinishReason.BLOCKLIST
        ) {
          throw new GeminiExtractionError(
            "safety_block",
            "Gemini blocked this document for safety reasons.",
            422
          );
        }
        if (!response.text?.trim()) {
          throw new GeminiExtractionError(
            "invalid_output",
            "Gemini returned no structured extraction.",
            422
          );
        }
        return response.text;
      } catch (error) {
        if (error instanceof GeminiExtractionError) throw error;
        const category = getGeminiErrorCategory(error);
        const diagnostics: GeminiProviderDiagnostics = {
          requestPreparationMs,
          durationMs: Date.now() - requestStartedAt,
          retryCount,
          providerStatus: getGeminiProviderStatus(error),
          providerCode: getGeminiProviderCode(error),
          providerErrorMessage: getGeminiProviderErrorMessage(error),
          providerErrorStatus: getGeminiProviderErrorStatus(error),
          providerErrorDetails: getGeminiProviderErrorDetails(error),
          errorName: getSafeGeminiErrorName(error) ?? "UnknownError",
          sanitizedMessage: getSanitizedGeminiErrorMessage(error),
        };
        input.onDiagnostics?.(diagnostics);
        throw new GeminiExtractionError(
          category,
          category === "timeout"
            ? "Gemini extraction timed out; retry the extraction."
            : category === "rate_limit"
              ? "Gemini is rate limited; try again shortly."
              : "Gemini extraction failed; retry later.",
          category === "rate_limit" ? 429 : category === "timeout" ? 504 : 502,
          undefined,
          diagnostics
        );
      }
    }
  );
}
