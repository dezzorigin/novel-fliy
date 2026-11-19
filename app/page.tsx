'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, Flame, Github, ArrowDown, ArrowRight, BookOpen, ScrollText, Ticket } from 'lucide-react';
import type { WebtoonItem } from '@/lib/webtoons-api';

const DAYS = [
  { key: 'daily', label: 'Harian' },
  { key: 'monday', label: 'Senin' },
  { key: 'tuesday', label: 'Selasa' },
  { key: 'wednesday', label: 'Rabu' },
  { key: 'thursday', label: 'Kamis' },
  { key: 'friday', label: 'Jumat' },
  { key: 'saturday', label: 'Sabtu' },
  { key: 'sunday', label: 'Minggu' },
  { key: 'completed', label: 'Tamat' },
] as const;

const GITHUB_URL = 'https://github.com/dezzorigin/novel-fliy';

export default function Home() {
  const router = useRouter();
  const [trending, setTrending] = useState<WebtoonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [day, setDay] = useState<string>('daily');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    setLoadError(false);
    fetch(`/api/trending?day=${day}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setTrending(data.items || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setTrending([]);
        setLoadError(true);
        setLoading(false);
      });
  }, [day]);

  const goSearch = () => {
    const q = searchQuery.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const preview = trending.slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] pb-20 md:pb-0">
      {/* HEADER LOKET */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b-4 border-white">
        <div className="max-w-6xl w-full mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 shrink-0" aria-label="NovelFliy — beranda">
            <span className="w-9 h-9 bg-[#ccff00] text-black font-black text-lg flex items-center justify-center leading-none">NF</span>
            <span className="font-black uppercase tracking-tight text-xl leading-none">Novel<span className="text-[#ccff00]">Fliy</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 font-mono text-sm uppercase" aria-label="Navigasi utama">
            <a href="#trending" className="hover:text-[#ccff00] transition-colors">Trending</a>
            <a href="#cara-baca" className="hover:text-[#ccff00] transition-colors">Cara baca</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className="md:hidden p-2.5 border-2 border-white hover:bg-white hover:text-black transition-colors"
              aria-label="Buka halaman pencarian"
            >
              <Search size={20} />
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2.5 border-2 border-white font-mono text-sm uppercase hover:bg-white hover:text-black transition-colors"
              aria-label="Kode sumber NovelFliy di GitHub"
            >
              <Github size={18} />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4">
        {/* HERO — MESIN CARI */}
        <section className="grid md:grid-cols-2 gap-8 md:gap-10 items-center py-10 md:py-16 border-b-4 border-white">
          <div className="min-w-0">
            <p className="font-mono text-xs md:text-sm uppercase tracking-widest text-[#00e5ff] mb-4">
              Pembaca webtoon — data langsung webtoons.com
            </p>
            <h1 className="text-4xl md:text-6xl font-black uppercase leading-[0.95] tracking-tight">
              Baca webtoon trending, langsung dari sumbernya.
            </h1>
            <p className="mt-5 text-neutral-300 max-w-[60ch] leading-relaxed">
              Cari judul, buka detail dan daftar episodenya, lalu baca sampai
              habis. Tanpa daftar, tanpa iklan, tanpa antre.
            </p>
            <form
              className="mt-7 flex border-4 border-white bg-black focus-within:border-[#ccff00] transition-colors"
              onSubmit={(e) => { e.preventDefault(); goSearch(); }}
              role="search"
            >
              <label htmlFor="hero-search" className="sr-only">Cari webtoon</label>
              <input
                id="hero-search"
                type="text"
                placeholder="CARI WEBTOON..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-w-0 bg-transparent text-white font-mono p-4 outline-none placeholder:text-neutral-500"
              />
              <button
                type="submit"
                disabled={!searchQuery.trim()}
                className="shrink-0 px-5 bg-[#ccff00] text-black flex items-center gap-2 font-black uppercase hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Cari"
              >
                <Search size={22} />
                <span className="hidden sm:inline">Cari</span>
              </button>
            </form>
            <a href="#trending" className="mt-5 inline-flex items-center gap-2 font-mono text-sm uppercase underline underline-offset-4 hover:text-[#ccff00] transition-colors">
              Lihat yang trending hari ini <ArrowDown size={16} />
            </a>
          </div>

          {/* PRATINJAU — TIKET 3 TERATAS */}
          <div aria-label="Pratinjau tiga webtoon teratas" className="min-w-0 border-4 border-white bg-black">
            <div className="flex items-center justify-between border-b-2 border-white px-4 py-3">
              <span className="font-mono text-xs uppercase tracking-widest flex items-center gap-2">
                <Ticket size={16} className="text-[#ccff00]" /> Tiket teratas
              </span>
              <span className="font-mono text-xs uppercase bg-[#ccff00] text-black px-2 py-0.5">
                {DAYS.find((d) => d.key === day)?.label ?? 'Harian'}
              </span>
            </div>
            {loading ? (
              <div className="p-4 flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-neutral-900 border-2 border-neutral-800 animate-pulse" />
                ))}
              </div>
            ) : loadError || preview.length === 0 ? (
              <p className="p-6 font-mono text-sm text-neutral-400 leading-relaxed">
                Trending belum termuat — webtoons.com atau proxy sedang tidak
                menjawab. Coba muat ulang halaman, atau cari judul langsung
                lewat kolom pencarian di atas.
              </p>
            ) : (
              <ol className="divide-y-2 divide-neutral-800">
                {preview.map((item, idx) => (
                  <li key={idx}>
                    <Link href={`/detail?url=${encodeURIComponent(item.url)}`} className="flex items-center gap-4 p-3 hover:bg-neutral-900 transition-colors group">
                      <span className="shrink-0 w-10 h-10 bg-white text-black font-black text-lg flex items-center justify-center group-hover:bg-[#ccff00] transition-colors">
                        {idx + 1}
                      </span>
                      <span className="relative w-12 aspect-[3/4] shrink-0 bg-neutral-800 border border-neutral-700 overflow-hidden">
                        {item.thumbnail && (
                          <Image
                            src={`/api/image-proxy?url=${encodeURIComponent(item.thumbnail)}`}
                            alt=""
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-bold uppercase truncate group-hover:text-[#ccff00] transition-colors">{item.title}</span>
                        <span className="block font-mono text-xs text-neutral-400 mt-1 uppercase">
                          {item.genre || 'Webtoon'}
                          {item.likes ? ` — ${item.likes} suka` : ''}
                        </span>
                      </span>
                      <ArrowRight size={18} className="ml-auto shrink-0 text-neutral-500 group-hover:text-[#ccff00] transition-colors" />
                    </Link>
                  </li>
                ))}
              </ol>
            )}
            <div className="border-t-2 border-dashed border-neutral-700 px-4 py-2.5 font-mono text-[11px] uppercase text-neutral-500">
              Sampul &amp; data milik webtoons.com
            </div>
          </div>
        </section>

        {/* TRENDING */}
        <section id="trending" className="py-10 md:py-14 scroll-mt-20">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-white pb-3 mb-5">
            <h2 className="text-3xl md:text-4xl font-black uppercase flex items-center gap-3">
              <Flame className="text-[#ff5c00]" size={32} /> Trending
            </h2>
            {!loading && !loadError && (
              <span className="font-mono text-sm bg-white text-black px-2 py-1">{trending.length} judul</span>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-3 mb-6" role="tablist" aria-label="Hari tayang">
            {DAYS.map((d) => (
              <button
                key={d.key}
                role="tab"
                aria-selected={day === d.key}
                onClick={() => setDay(d.key)}
                className={`shrink-0 px-4 py-2.5 font-mono text-sm uppercase border-2 transition-colors ${
                  day === d.key
                    ? 'bg-[#ccff00] text-black border-[#ccff00] font-bold'
                    : 'border-white hover:border-[#ccff00] hover:text-[#ccff00]'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="aspect-[3/4] bg-neutral-900 border-2 border-neutral-800 animate-pulse" />
              ))}
            </div>
          ) : loadError || trending.length === 0 ? (
            <div className="p-8 border-4 border-dashed border-neutral-700 font-mono text-center text-neutral-400 leading-relaxed">
              {loadError
                ? 'Trending gagal dimuat — webtoons.com atau proxy sedang tidak menjawab. Coba lagi sebentar lagi.'
                : 'Tidak ada judul untuk hari ini.'}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {trending.map((item, idx) => (
                <Link
                  key={`${item.titleNo}-${idx}`}
                  href={`/detail?url=${encodeURIComponent(item.url)}`}
                  className="group relative min-w-0 border-2 border-transparent hover:border-[#ccff00] transition-colors overflow-hidden bg-neutral-900"
                >
                  <div className="aspect-[3/4] relative">
                    {item.thumbnail ? (
                      <Image
                        src={`/api/image-proxy?url=${encodeURIComponent(item.thumbnail)}`}
                        alt={item.title}
                        fill
                        unoptimized
                        className="object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-800 flex items-center justify-center font-mono text-xs text-neutral-500">TANPA SAMPUL</div>
                    )}
                    <div className="absolute top-0 right-0 bg-white text-black font-black px-2.5 py-1.5 text-lg leading-none group-hover:bg-[#ccff00] transition-colors">
                      #{idx + 1}
                    </div>
                  </div>
                  <div className="p-3 border-t-2 border-neutral-800 group-hover:border-[#ccff00] bg-black transition-colors">
                    <h3 className="font-bold leading-tight line-clamp-1 group-hover:text-[#ccff00] uppercase transition-colors">{item.title}</h3>
                    <div className="flex justify-between items-center mt-2 gap-2">
                      <span className="text-[10px] font-mono bg-white text-black px-1.5 py-0.5 uppercase truncate">{item.genre || 'Webtoon'}</span>
                      {item.likes && <span className="text-[10px] font-mono text-[#ff2d6b] shrink-0">{item.likes} suka</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* CARA BACA — SATU STRIP, BUKAN 3 KARTU */}
        <section id="cara-baca" className="pb-12 md:pb-16 scroll-mt-20" aria-label="Cara baca">
          <h2 className="text-2xl md:text-3xl font-black uppercase mb-5">Cara baca</h2>
          <ol className="grid md:grid-cols-3 border-4 border-white divide-y-4 md:divide-y-0 md:divide-x-4 divide-white">
            <li className="p-5 flex items-start gap-4">
              <Search size={28} className="text-[#ccff00] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-black uppercase text-lg leading-tight">Cari judul</h3>
                <p className="font-mono text-sm text-neutral-400 mt-1 leading-relaxed">Ketik judul atau kata kunci di kolom pencarian.</p>
              </div>
            </li>
            <li className="p-5 flex items-start gap-4">
              <BookOpen size={28} className="text-[#00e5ff] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-black uppercase text-lg leading-tight">Pilih episode</h3>
                <p className="font-mono text-sm text-neutral-400 mt-1 leading-relaxed">Buka detail, baca sinopsis, lalu pilih episode dari daftar.</p>
              </div>
            </li>
            <li className="p-5 flex items-start gap-4">
              <ScrollText size={28} className="text-[#ff5c00] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-black uppercase text-lg leading-tight">Baca sampai habis</h3>
                <p className="font-mono text-sm text-neutral-400 mt-1 leading-relaxed">Gulir ke bawah — halaman episode tersusun vertikal.</p>
              </div>
            </li>
          </ol>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t-4 border-white">
        <div className="max-w-6xl w-full mx-auto px-4 py-8 flex flex-col md:flex-row md:items-start gap-8">
          <div className="md:flex-1">
            <p className="font-black uppercase tracking-tight text-2xl leading-none">Novel<span className="text-[#ccff00]">Fliy</span></p>
            <p className="font-mono text-sm text-neutral-400 mt-3 max-w-[52ch] leading-relaxed">
              Pembaca webtoon brutalist. Semua judul, sampul, dan episode
              diambil langsung dari webtoons.com — NovelFliy bukan afiliasi
              resmi WEBTOON.
            </p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-neutral-500 mb-3">Sumber data</p>
            <a href="https://www.webtoons.com/id" target="_blank" rel="noopener noreferrer" className="block font-bold uppercase hover:text-[#ccff00] transition-colors">
              webtoons.com ↗
            </a>
            <a href="/api/status" className="block font-mono text-sm text-neutral-400 mt-2 hover:text-[#ccff00] transition-colors">
              Status API ↗
            </a>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-neutral-500 mb-3">Kode</p>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-bold uppercase hover:text-[#ccff00] transition-colors">
              <Github size={18} /> GitHub ↗
            </a>
            <p className="font-mono text-sm text-neutral-400 mt-2">Lisensi MIT</p>
          </div>
        </div>
        <div className="border-t-2 border-neutral-800">
          <div className="max-w-6xl w-full mx-auto px-4 py-4 flex flex-wrap justify-between gap-2 font-mono text-xs text-neutral-500">
            <span>© 2026 NOVELFLIY PROJECT</span>
            <span>DIBUAT OLEH DEZZORIGIN</span>
          </div>
        </div>
      </footer>

      {/* NAV BAWAH MOBILE */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t-4 border-white flex z-50 h-14" aria-label="Navigasi mobile">
        <Link href="/" className="flex-1 flex items-center justify-center bg-[#ccff00] text-black font-bold text-sm uppercase tracking-widest border-r-2 border-white">
          Beranda
        </Link>
        <Link href="/search" className="flex-1 flex items-center justify-center text-white font-bold text-sm uppercase tracking-widest hover:bg-[#00e5ff] hover:text-black transition-colors">
          Cari
        </Link>
      </nav>
    </div>
  );
}
