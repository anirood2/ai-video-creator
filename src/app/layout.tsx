import './globals.css';

export const metadata = {
  title: 'AI Video Creator',
  description: 'Upload images + prompt → AI-generated video clips',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[#08080c] text-[#e2e0db]" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
        <div className="fixed inset-0 pointer-events-none z-0" style={{
          background: 'radial-gradient(ellipse at 15% 10%, #b8f00006 0%, transparent 45%), radial-gradient(ellipse at 85% 90%, #4444ff06 0%, transparent 45%)'
        }} />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
