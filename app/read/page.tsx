'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowUpCircle, ExternalLink } from 'lucide-react';

function ReadContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url');

  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!url) return;
    setLoading(true);
    setLoadError(false);
    fetch(`/api/read?url=${encodeURIComponent(url)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setImages(data.images || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadError(true);
        setLoading(false);
      });
  }, [url]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!url) {
    return <div className="p-8 text-center font-mono text-[#ff5c00] font-bold">Tidak ada URL episode — kembali dan pilih episode dari daftar.</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-t-[#ccff00] border-transparent rounded-full animate-spin" role="status" aria-label="Memuat"></div>
        <div className="font-mono tracking-widest animate-pulse uppercase">Memuat halaman episode...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-12 text-center border-4 border-dashed border-neutral-700 m-4 font-mono text-neutral-400 leading-relaxed">
        Halaman episode gagal dimuat — webtoons.com atau proxy sedang tidak
        menjawab. Coba lagi sebentar lagi.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center bg-[#0a0a0a] min-h-screen relative">
      <div className="w-full max-w-2xl bg-neutral-900 border-x-2 border-neutral-800 pb-20">
        {images.length === 0 ? (
          <div className="p-12 text-center border-4 border-dashed border-neutral-700 m-4 font-mono text-neutral-500 leading-relaxed">
            Tidak ada halaman gambar untuk episode ini.
            <br /><br />
            Kemungkinan episode premium atau butuh login di aplikasi WEBTOON.
            <br /><br />
            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 underline underline-offset-4 text-white hover:text-[#ccff00] transition-colors">
              Buka episode ini di webtoons.com <ExternalLink size={14} />
            </a>
          </div>
        ) : (
          <div className="flex flex-col w-full">
            {images.map((img, idx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={idx}
                src={`/api/image-proxy?url=${encodeURIComponent(img)}`}
                alt={`Halaman ${idx + 1} dari ${images.length}`}
                className="w-full h-auto block"
                loading="lazy"
              />
            ))}
          </div>
        )}
      </div>

      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 p-3 bg-white text-black border-4 border-black hover:bg-[#ccff00] hover:-translate-y-1 transition-all z-50 shadow-[4px_4px_0_rgba(204,255,0,1)]"
        aria-label="Kembali ke atas"
      >
        <ArrowUpCircle size={32} />
      </button>
    </div>
  );
}

export default function ReadPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b-4 border-[#ccff00] p-2 md:p-4 flex items-center gap-4">
        <button onClick={() => window.history.back()} className="p-2 bg-transparent hover:bg-[#ccff00] hover:text-black text-white transition-colors border-2 border-transparent" aria-label="Kembali">
          <ArrowLeft size={24} />
        </button>
        <span className="font-black uppercase tracking-widest text-[#ccff00]">Pembaca episode</span>
      </header>

      <main className="flex-1 w-full flex-col">
        <Suspense fallback={<div className="flex h-screen items-center justify-center font-mono animate-pulse text-[#ccff00]">Menyiapkan pembaca...</div>}>
          <ReadContent />
        </Suspense>
      </main>
    </div>
  );
}
