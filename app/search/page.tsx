'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search as SearchIcon, ArrowLeft } from 'lucide-react';
import type { SearchResult, WebtoonItem } from '@/lib/webtoons-api';
import Image from 'next/image';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(!!initialQ);
  const [loadError, setLoadError] = useState(false);

  const fetchResults = (q: string) => {
    if (!q) return;
    setLoading(true);
    setLoadError(false);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setResults(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setResults(null);
        setLoadError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (initialQ) {
      fetchResults(initialQ);
    }
  }, [initialQ]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.history.replaceState({}, '', `/search?q=${encodeURIComponent(query)}`);
      fetchResults(query);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSearch} className="flex border-4 border-white bg-black focus-within:border-[#00e5ff] transition-colors" role="search">
        <label htmlFor="search-input" className="sr-only">Cari webtoon</label>
        <input
          id="search-input"
          type="text"
          placeholder="CARI WEBTOON..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full min-w-0 bg-transparent text-white font-mono p-4 outline-none placeholder:text-neutral-500"
          autoFocus={!initialQ}
        />
        <button
          type="submit"
          disabled={!query.trim()}
          className="shrink-0 p-4 bg-white text-black flex items-center justify-center hover:bg-[#00e5ff] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Cari"
        >
          <SearchIcon size={24} className="font-bold" />
        </button>
      </form>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-neutral-900 border-2 border-neutral-700 animate-pulse"></div>
          ))}
        </div>
      ) : loadError ? (
        <p className="p-8 text-center border-4 border-dashed border-neutral-700 text-neutral-400 font-mono leading-relaxed">
          Pencarian gagal dimuat — webtoons.com atau proxy sedang tidak
          menjawab. Coba lagi sebentar lagi.
        </p>
      ) : results ? (
        <div className="flex flex-col gap-8">
          <div className="font-mono font-bold border-b-2 border-white pb-2 flex flex-wrap justify-between gap-2 uppercase">
            <span>Hasil untuk &ldquo;{results.query}&rdquo;</span>
            <span className="bg-white text-black px-2">{results.count} ditemukan</span>
          </div>

          {results.items?.length === 0 && (
            <div className="p-8 text-center border-4 border-dashed border-neutral-700 text-neutral-500 font-mono">
              Tidak ada judul yang cocok. Coba kata kunci lain.
            </div>
          )}

          <div className="flex flex-col gap-4">
            {results.items?.map((item: WebtoonItem, idx: number) => (
              <Link
                key={idx}
                href={`/detail?url=${encodeURIComponent(item.url)}`}
                className="flex gap-4 border-4 border-neutral-800 bg-black hover:border-[#00e5ff] transition-colors group p-2"
              >
                <div className="w-24 md:w-32 aspect-[3/4] bg-neutral-900 relative border-2 border-neutral-700 shrink-0">
                  {item.thumbnail && (
                    <Image
                      src={`/api/image-proxy?url=${encodeURIComponent(item.thumbnail)}`}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover grayscale group-hover:grayscale-0"
                    />
                  )}
                </div>
                <div className="flex flex-col py-2 flex-1 min-w-0">
                  <h3 className="text-xl md:text-2xl font-black uppercase leading-none mb-2 group-hover:text-[#00e5ff] transition-colors">{item.title}</h3>
                  <p className="font-mono text-xs md:text-sm text-neutral-400 mb-2 uppercase">{item.author || 'Penulis tidak diketahui'}</p>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <span className="text-[10px] md:text-xs font-mono bg-white text-black px-2 py-1 uppercase">{item.section}</span>
                    {item.genre && (
                      <span className="text-[10px] md:text-xs font-mono border border-white px-2 py-1 uppercase">{item.genre}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <p className="p-8 text-center border-4 border-dashed border-neutral-700 text-neutral-500 font-mono">
          Ketik judul webtoon di atas, lalu tekan cari.
        </p>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] pb-20 md:pb-0">
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b-4 border-white p-4 flex items-center gap-4">
        <Link href="/" className="p-2 border-2 border-white hover:bg-white hover:text-black transition-colors" aria-label="Kembali ke beranda">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-black tracking-tight uppercase">Cari webtoon</h1>
      </header>
      <main className="flex-1 max-w-4xl w-full mx-auto p-4">
        <Suspense fallback={<div className="p-8 text-center font-mono animate-pulse">Memuat pencarian...</div>}>
          <SearchContent />
        </Suspense>
      </main>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t-4 border-white flex z-50 h-14" aria-label="Navigasi mobile">
        <Link href="/" className="flex-1 flex items-center justify-center hover:bg-[#ccff00] hover:text-black transition-colors border-r-2 border-white font-bold text-sm uppercase tracking-widest">
          Beranda
        </Link>
        <Link href="/search" className="flex-1 flex items-center justify-center bg-[#00e5ff] text-black font-bold text-sm uppercase tracking-widest">
          Cari
        </Link>
      </nav>
    </div>
  );
}
