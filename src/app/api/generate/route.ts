import { NextRequest, NextResponse } from "next/server";

const HF_API_TOKEN = process.env.HF_API_TOKEN;
const HF_MODEL_ID = process.env.HF_MODEL_ID;

export async function POST(req: NextRequest) {
  try {
    if (!HF_API_TOKEN || !HF_MODEL_ID) {
      return NextResponse.json(
        {
          error:
            "HF_API_TOKEN or HF_MODEL_ID not set. Add them in Vercel Environment Variables.",
        },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const imageFile = formData.get("image") as File;
    const prompt = formData.get("prompt") as string;

    if (!imageFile || !prompt) {
      return NextResponse.json(
        { error: "Image and prompt required" },
        { status: 400 }
      );
    }

    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const payload = {
      inputs: {
        image: base64,
        prompt,
      },
    };

    const hfResponse = await fetch(
      `https://api-inference.huggingface.co/models/${HF_MODEL_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!hfResponse.ok) {
      const text = await hfResponse.text();
      return NextResponse.json(
        {
          error: "Generation failed with Hugging Face",
          detail: text,
        },
        { status: 500 }
      );
    }

    const arrayBuffer = await hfResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const videoBase64 = buffer.toString("base64");
    const videoMimeType = "video/mp4";

    return NextResponse.json({
      videoUrl: `${videoMimeType};base64,${videoBase64}`,
    });
  } catch (error: any) {
    const msg = error?.message || "Generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
