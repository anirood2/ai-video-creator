'use client';

import { useState, useRef } from 'react';

interface Clip {
  id: number;
  preview: string;
  videoUrl: string | null;
  status: 'pending' | 'generating' | 'done' | 'error';
  error?: string;
}

export default function Home() {
  const [phase, setPhase] = useState<'input' | 'generating' | 'result'>('input');
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [prompt, setPrompt] = useState('');
  const [clips, setClips] = useState<Clip[]>([]);
  const [activeClip, setActiveClip] = useState(0);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // --- Image handling ---
  const addImages = (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, 5 - images.length);
    setImages(prev => [...prev, ...arr.map(f => ({ file: f, preview: URL.createObjectURL(f) }))].slice(0, 5));
  };

  const removeImage = (i: number) => {
    URL.revokeObjectURL(images[i].preview);
    setImages(prev => prev.filter((_, j) => j !== i));
  };

  // --- Generation ---
  const generate = async () => {
    if (!images.length || !prompt.trim()) return;
    setPhase('generating');
    setError('');

    const initial: Clip[] = images.map((img, i) => ({
      id: i, preview: img.preview, videoUrl: null, status: 'pending',
    }));
    setClips(initial);

    for (let i = 0; i < images.length; i++) {
      setClips(prev => prev.map((c, j) => j === i ? { ...c, status: 'generating' } : c));

      try {
        const form = new FormData();
        form.append('image', images[i].file);
        form.append('prompt', prompt);

        const res = await fetch('/api/generate', { method: 'POST', body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');

        setClips(prev => prev.map((c, j) => j === i ? { ...c, videoUrl: data.videoUrl, status: 'done' } : c));
      } catch (err: any) {
        setClips(prev => prev.map((c, j) => j === i ? { ...c, status: 'error', error: err.message } : c));
      }
    }
    setPhase('result');
  };

  const reset = () => {
    setPhase('input');
    setClips([]);
    setImages([]);
    setPrompt('');
    setError('');
    setActiveClip(0);
  };

  // --- Styles ---
  const card = "bg-[#13131d] border border-[#1c1c2e] rounded-xl p-5 mb-4";
  const label = "block text-[11px] font-bold text-[#888] mb-3 uppercase tracking-widest";
  const dim = "text-[#55556a]";
  const lime = "#b8f000";

  // =================== INPUT PHASE ===================
  if (phase === 'input') return (
    <main className="max-w-2xl mx-auto px-4 py-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ background: lime }}>🎬</div>
        <h1 className="text-2xl font-extrabold tracking-tight"><span style={{ color: lime }}>AI</span> Video Creator</h1>
      </div>
      <p className={`text-sm mb-8 ml-12 ${dim}`}>Upload images + write a prompt → get AI video clips</p>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm mb-4">{error}</div>}

      {/* Upload */}
      <div className={card}>
        <label className={label}>Your Images ({images.length}/5)</label>

        {images.length > 0 && (
          <div className="grid grid-cols-5 gap-2 mb-4">
            {images.map((img, i) => (
              <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-[#1c1c2e]">
                <img src={img.preview} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => removeImage(i)} className="w-6 h-6 rounded-full bg-red-500/80 text-white text-xs font-bold">✕</button>
                </div>
                <div className="absolute bottom-1 left-1 bg-black/60 text-[9px] font-bold px-1 py-0.5 rounded" style={{ color: lime }}>{i + 1}</div>
              </div>
            ))}
          </div>
        )}

        {images.length < 5 && (
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); addImages(e.dataTransfer.files); }}
            className="border-2 border-dashed border-[#1c1c2e] rounded-xl p-8 text-center cursor-pointer hover:border-[#b8f00060] transition-colors"
          >
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={e => e.target.files && addImages(e.target.files)} className="hidden" />
            <div className="text-3xl mb-2">{images.length === 0 ? '📸' : '➕'}</div>
            <div className="font-semibold text-sm mb-1">{images.length === 0 ? 'Tap to upload images' : `Add more (${5 - images.length} left)`}</div>
            <div className={`text-xs ${dim}`}>PNG, JPG, WEBP · Up to 5 · Each becomes a video scene</div>
          </div>
        )}
      </div>

      {/* Prompt */}
      <div className={card}>
        <label className={label}>Describe the Motion & Style</label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="How should the images animate? E.g., 'Gentle watercolor animation, soft camera movement, warm lighting, floating particles...'"
          rows={4}
          className="w-full bg-[#0a0a10] border border-[#1c1c2e] rounded-lg p-4 text-sm text-[#e2e0db] placeholder-[#55556a] outline-none focus:border-[#b8f000] resize-none leading-relaxed"
        />
        {!prompt && (
          <div className="flex flex-wrap gap-2 mt-3">
            {["Gentle camera movement, dreamy atmosphere", "Cinematic zoom in, dramatic lighting", "Slow pan, warm golden hour light", "Subtle animation, watercolor storybook style"].map((s, i) => (
              <button key={i} onClick={() => setPrompt(s)}
                className={`text-[11px] px-3 py-1.5 rounded-full bg-[#0a0a10] border border-[#1c1c2e] ${dim} hover:border-[#b8f000] hover:text-[#b8f000] transition-colors`}>
                {s.substring(0, 35)}...
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Generate button */}
      <button onClick={generate} disabled={!images.length || !prompt.trim()}
        className="w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ background: lime, color: '#000' }}>
        ▶ Generate Video ({images.length} {images.length === 1 ? 'clip' : 'clips'})
      </button>

      {/* How it works */}
      <div className={`${card} mt-4`}>
        <h3 className="text-xs font-bold mb-3 uppercase tracking-widest" style={{ color: lime }}>How It Works</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '📸', t: 'Upload', d: '1-5 images as scenes' },
            { icon: '✍️', t: 'Prompt', d: 'Describe the motion' },
            { icon: '🎬', t: 'Generate', d: 'AI creates video clips' },
          ].map((s, i) => (
            <div key={i} className="bg-[#0a0a10] rounded-lg p-3 text-center">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="font-semibold text-xs mb-0.5">{s.t}</div>
              <div className={`text-[10px] ${dim}`}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      <footer className={`mt-10 pt-6 border-t border-[#1c1c2e] text-center text-xs ${dim}`}>
        AI Video Creator · Powered by <a href="https://replicate.com" target="_blank" className="hover:underline" style={{ color: lime }}>Replicate</a>
      </footer>
    </main>
  );

  // =================== GENERATING PHASE ===================
  if (phase === 'generating') {
    const done = clips.filter(c => c.status === 'done').length;
    const current = clips.findIndex(c => c.status === 'generating');

    return (
      <main className="max-w-2xl mx-auto px-4 py-8 animate-fade-up">
        <div className={card + " text-center py-10"}>
          <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center text-3xl mx-auto mb-4 pulse-glow"
            style={{ borderColor: lime, background: '#b8f00010' }}>🎬</div>
          <h2 className="text-lg font-bold mb-2">Generating Your Video</h2>
          <p className={`text-sm mb-6 ${dim}`}>Creating clip {Math.min((current >= 0 ? current : done) + 1, images.length)} of {images.length}...</p>
          <div className="w-full max-w-xs mx-auto h-2 bg-[#1c1c2e] rounded-full overflow-hidden mb-3">
            <div className="h-full rounded-full transition-all duration-700" style={{ background: lime, width: `${Math.max((done / images.length) * 100, 8)}%` }} />
          </div>
          <div className={`text-xs font-mono ${dim}`}>{done}/{images.length} complete</div>
        </div>

        <div className="space-y-2">
          {clips.map((c, i) => (
            <div key={i} className="bg-[#13131d] border border-[#1c1c2e] rounded-lg p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-[#1c1c2e]">
                <img src={c.preview} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1"><div className="font-semibold text-sm">Scene {i + 1}</div></div>
              <div className="shrink-0 text-xs font-mono">
                {c.status === 'pending' && <span className={dim}>Waiting</span>}
                {c.status === 'generating' && <span style={{ color: lime }}>Generating...</span>}
                {c.status === 'done' && <span className="text-green-400">✓ Done</span>}
                {c.status === 'error' && <span className="text-red-400">✕ Error</span>}
              </div>
            </div>
          ))}
        </div>
        <p className={`text-center text-xs mt-4 ${dim}`}>Each clip takes 30-90 seconds. Don't close this page!</p>
      </main>
    );
  }

  // =================== RESULT PHASE ===================
  const success = clips.filter(c => c.status === 'done' && c.videoUrl);
  const failed = clips.filter(c => c.status === 'error');

  if (success.length === 0) return (
    <main className="max-w-2xl mx-auto px-4 py-8 animate-fade-up">
      <div className={card + " text-center py-10"}>
        <div className="text-3xl mb-3">😔</div>
        <h2 className="text-lg font-bold mb-2">Generation Failed</h2>
        <p className={`text-sm mb-4 ${dim}`}>{failed[0]?.error || 'Something went wrong.'}</p>
        <button onClick={reset} className="px-6 py-3 rounded-lg font-bold text-sm" style={{ background: lime, color: '#000' }}>← Try Again</button>
      </div>
    </main>
  );

  const current = success[activeClip];
  return (
    <main className="max-w-2xl mx-auto px-4 py-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ background: lime }}>🎬</div>
        <h1 className="text-2xl font-extrabold tracking-tight"><span style={{ color: lime }}>AI</span> Video Creator</h1>
        <button onClick={reset} className={`ml-auto px-4 py-2 rounded-lg border border-[#1c1c2e] text-xs font-semibold ${dim} hover:border-[#b8f000]`}>← New Video</button>
      </div>

      {/* Success banner */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3 mb-4">
        <span className="text-xl">✅</span>
        <span className="font-semibold text-sm text-green-400">{success.length} clip{success.length > 1 ? 's' : ''} generated!</span>
      </div>

      {/* Video player */}
      <div className="bg-black rounded-xl overflow-hidden mb-4">
        {current?.videoUrl && (
          <video key={current.videoUrl} src={current.videoUrl} controls autoPlay loop playsInline className="w-full aspect-video" />
        )}
      </div>

      {/* Clip selector */}
      {success.length > 1 && (
        <div className="flex gap-2 mb-4">
          {success.map((c, i) => (
            <button key={c.id} onClick={() => setActiveClip(i)}
              className={`flex-1 rounded-lg overflow-hidden border-2 transition-all ${i === activeClip ? 'border-[#b8f000]' : 'border-[#1c1c2e]'}`}>
              <div className="aspect-video relative">
                <img src={c.preview} alt="" className="w-full h-full object-cover" />
                <div className="absolute bottom-1 left-1 bg-black/70 text-[9px] font-bold px-1 py-0.5 rounded" style={{ color: lime }}>{i + 1}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mb-4">
        <a href={current?.videoUrl || '#'} download={`scene-${activeClip + 1}.mp4`} target="_blank" rel="noopener"
          className="flex-1 py-3 rounded-xl font-bold text-sm text-center" style={{ background: lime, color: '#000' }}>
          ↓ Download Clip {activeClip + 1}
        </a>
        <button onClick={reset} className={`px-6 py-3 border border-[#1c1c2e] rounded-xl font-semibold text-sm ${dim}`}>New Video</button>
      </div>

      {/* Tip */}
      <div className={card}>
        <div className="text-xs font-bold mb-2 uppercase tracking-widest" style={{ color: lime }}>💡 Next Steps</div>
        <p className={`text-xs leading-relaxed ${dim}`}>
          Download your clips and stitch them in <strong>CapCut</strong> (free) or <strong>DaVinci Resolve</strong> (free).
          Add transitions, music, and voiceover for a polished video.
        </p>
      </div>
    </main>
  );
}
