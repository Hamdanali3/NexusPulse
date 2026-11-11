import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/db/supabase-client";
import { isAllowedFetchSite, sanitizeText } from "@/lib/security/validation";

const VARY_HEADERS = {
  Vary: "Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site",
};

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "application/pdf",
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  if (!isAllowedFetchSite(req.headers)) {
    return NextResponse.json(
      { error: "Cross-site media upload rejected by Sec-Fetch-Site policy" },
      { status: 403, headers: VARY_HEADERS }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bountyId = sanitizeText(formData.get("bountyId")?.toString() || "", 64);
    const purpose = sanitizeText(formData.get("purpose")?.toString() || "bounty_evidence", 64);

    if (!file) {
      return NextResponse.json(
        { error: "No media file provided. Expected 'file' multipart field." },
        { status: 400, headers: VARY_HEADERS }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported file MIME type (${file.type}). Allowed: JPG, PNG, WebP, GIF, MP4, PDF.`,
        },
        { status: 400, headers: VARY_HEADERS }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds 10MB limit.`,
        },
        { status: 400, headers: VARY_HEADERS }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const safeFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    // 1. Attempt upload to Supabase Storage if configured
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const bucketName = "bounty-evidence";
        const storagePath = `${purpose}/${bountyId || "general"}/${safeFileName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(storagePath, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(storagePath);

          return NextResponse.json(
            {
              success: true,
              mediaUrl: publicUrlData.publicUrl,
              fileName: safeFileName,
              mimeType: file.type,
              sizeBytes: file.size,
              storageProvider: "supabase_storage",
              base64,
            },
            { headers: VARY_HEADERS }
          );
        }
      }
    }

    // 2. Resilient fallback: Return validated data URI representation
    const dataUri = `data:${file.type};base64,${base64}`;

    return NextResponse.json(
      {
        success: true,
        mediaUrl: dataUri,
        fileName: safeFileName,
        mimeType: file.type,
        sizeBytes: file.size,
        storageProvider: "embedded_data_uri",
        base64,
      },
      { headers: VARY_HEADERS }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Media upload processing failed";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: VARY_HEADERS }
    );
  }
}
