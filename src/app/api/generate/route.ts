import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

export async function POST(req: NextRequest) {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({ error: 'REPLICATE_API_TOKEN not set. Add it in Vercel Environment Variables.' }, { status: 500 });
    }

    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    const prompt = formData.get('prompt') as string;

    if (!imageFile || !prompt) {
      return NextResponse.json({ error: 'Image and prompt required' }, { status: 400 });
    }

    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const dataUri = `data:${imageFile.type || 'image/png'};base64,${base64}`;

    const output = await replicate.run(
      "wan-video/wan-2.2-i2v-fast",
      { input: { image: dataUri, prompt } }
    );

    let videoUrl;
    if (typeof output === 'string') videoUrl = output;
    else if (Array.isArray(output) && output.length > 0) videoUrl = String(output[0]);
    else if (output && typeof output === 'object' && 'url' in output) videoUrl = output.url;
    else videoUrl = String(output);

    if (!videoUrl || videoUrl.includes('[object')) {
      return NextResponse.json({ error: 'Unexpected response from video model' }, { status: 500 });
    }

    return NextResponse.json({ videoUrl });

  } catch (error) {
    const msg = error.message || 'Generation failed';
    if (msg.includes('token') || msg.includes('Unauthenticated'))
      return NextResponse.json({ error: 'Invalid Replicate API token' }, { status: 401 });
    if (msg.includes('billing') || msg.includes('payment'))
      return NextResponse.json({ error: 'Free credits used up. Add billing at replicate.com/account/billing' }, { status: 402 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
