import { NextRequest, NextResponse } from "next/server";

import { AiCardDraftCreateSchema } from "@/contracts/ai-card-drafts";
import { getCurrentSession } from "@/server/auth/current-session";
import { aiCardDraftService } from "@/server/ai-card-drafts/service";
import {
  authRequired,
  invalidRequest,
  readJson,
  serviceErrorResponse
} from "./route-helpers";

export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

type AudioUpload = FormDataEntryValue & {
  arrayBuffer: () => Promise<ArrayBuffer>;
  size: number;
  type: string;
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getCurrentSession(request);

  if (!session) {
    return authRequired();
  }

  try {
    return NextResponse.json(await aiCardDraftService.list(session));
  } catch (error) {
    return serviceErrorResponse(error);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getCurrentSession(request);

  if (!session) {
    return authRequired();
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.toLowerCase().includes("multipart/form-data")) {
    return createFromMultipart(request, session);
  }

  const parsed = AiCardDraftCreateSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return invalidRequest();
  }
  const inputText = parsed.data.inputText;
  if (!inputText) {
    return invalidRequest();
  }

  try {
    const created = await aiCardDraftService.createFromText(session, {
      inputText
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}

async function createFromMultipart(
  request: NextRequest,
  session: NonNullable<Awaited<ReturnType<typeof getCurrentSession>>>
) {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const parsedContentLength = Number(contentLength);
    if (
      !Number.isSafeInteger(parsedContentLength) ||
      parsedContentLength > MAX_AUDIO_BYTES
    ) {
      return invalidRequest();
    }
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return invalidRequest();
  }

  const audio = formData.get("audio");
  if (!isAudioUpload(audio) || audio.size === 0) {
    return invalidRequest();
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return invalidRequest();
  }

  const contextText = readOptionalText(formData, "contextText") ??
    readOptionalText(formData, "inputText");

  try {
    const created = await aiCardDraftService.createFromAudio(session, {
      audioBytes: Buffer.from(await audio.arrayBuffer()),
      audioMimeType: audio.type || "application/octet-stream",
      ...(contextText ? { contextText } : {})
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}

function readOptionalText(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function isAudioUpload(value: FormDataEntryValue | null): value is AudioUpload {
  return (
    value !== null &&
    typeof value === "object" &&
    "arrayBuffer" in value &&
    typeof value.arrayBuffer === "function" &&
    "size" in value &&
    typeof value.size === "number" &&
    "type" in value &&
    typeof value.type === "string"
  );
}
