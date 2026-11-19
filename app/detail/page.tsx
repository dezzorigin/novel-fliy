'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Star, Heart, Clock, Users, ExternalLink } from 'lucide-react';
import type { EpisodeItem, EpisodesResult } from '@/lib/webtoons-api';

function DetailContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url');

  const [detail, setDetail] = useState<EpisodesResult | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!url) return;
    setLoading(true);
    setLoadError(false);
    fetch(`/api/episodes?url=${encodeURIComponent(url)}&page=1`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setDetail(data);
        setEpisodes(data.episodesList || []);
        setHasMore(data.hasNext);
        setPage(1);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadError(true);
        setLoading(false);
      });
  }, [url]);

  const loadMore = () => {
    if (!url || !hasMore || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    fetch(`/api/episodes?url=${encodeURIComponent(url)}&page=${nextPage}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setEpisodes((prev) => [...prev, ...(data.episodesList || [])]);
        setHasMore(data.hasNext);
        setPage(nextPage);
        setLoadingMore(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingMore(false);
      });
  };

  if (!url) {
    return <div className="p-8 text-center font-mono text-[#ff2d6b] uppercase font-bold border-4 border-[#ff2d6b]">Tidak ada URL judul — kembali dan pilih dari daftar trending atau pencarian.</div>;
  }

  if (loading) {
    return (
      <div className="animate-pulse flex flex-col gap-8">
        <div className="h-64 bg-neutral-900 border-4 border-neutral-700"></div>
        <div className="h-8 w-1/2 bg-neutral-900"></div>
        <div className="h-4 w-3/4 bg-neutral-900"></div>
      </div>
    );
  }

  if (loadError || !detail) {
    return (
      <div className="p-8 text-center font-mono border-4 border-dashed border-neutral-700 uppercase text-neutral-400 leading-relaxed">
        Detail gagal dimuat — webtoons.com atau proxy sedang tidak menjawab.
        <br />
        <Link href="/" className="inline-block mt-4 px-4 py-2 border-2 border-white text-white normal-case hover:bg-white hover:text-black transition-colors">
          Kembali ke beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 flex-1">
      {/* INFO JUDUL */}
      <div className="bg-neutral-900 border-4 border-white p-4 relative overflow-hidden flex flex-col md:flex-row gap-6">
        <div className="w-48 aspect-[3/4] shrink-0 border-4 border-black relative mx-auto md:mx-0 z-10 bg-black">
          {detail.thumbnail ? (
            <Image
              src={`/api/image-proxy?url=${encodeURIComponent(detail.thumbnail)}`}
              alt={detail.title ?? "Sampul webtoon"}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-mono text-neutral-600">TANPA SAMPUL</div>
          )}
        </div>

        <div className="flex flex-col flex-1 z-10 items-center md:items-start text-center md:text-left">
          <div className="bg-[#ccff00] text-black px-2 py-1 font-bold font-mono text-xs inline-block mb-3 uppercase">
            {detail.status === 'COMPLETED' ? 'Tamat' : detail.status === 'ONGOING' ? 'Ongoing' : 'Status tidak diketahui'}
          </div>

          <h1 className="text-3xl md:text-5xl font-black uppercase mb-2 leading-none">{detail.title}</h1>
          <p className="font-mono text-neutral-400 mb-4">{detail.author}</p>

          <div className="bg-black border-2 border-white flex flex-wrap mb-4 w-full md:w-auto">
            {detail.genre && (
              <div className="p-2 border-r-2 border-white flex items-center gap-1">
                <span className="font-bold text-xs uppercase">{detail.genre}</span>
              </div>
            )}
            {detail.rating && (
              <div className="p-2 border-r-2 border-white flex items-center gap-1 text-[#ff5c00]">
                <Star size={16} fill="currentColor" />
                <span className="font-bold text-xs">{detail.rating}</span>
              </div>
            )}
            {detail.subscribers && (
              <div className="p-2 border-r-2 border-white flex items-center gap-1 text-[#00e5ff]">
                <Users size={16} />
                <span className="font-bold text-xs">{detail.subscribers}</span>
              </div>
            )}
            {detail.day && (
              <div className="p-2 flex items-center gap-1 text-[#ff5c00]">
                <Clock size={16} />
                <span className="font-bold text-xs uppercase">{detail.day}</span>
              </div>
            )}
          </div>

          {detail.synopsis && (
            <p className="text-sm border-l-4 border-[#ff2d6b] pl-4 text-neutral-300 leading-relaxed text-left">
              {detail.synopsis}
            </p>
          )}

          <a
            href={detail.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 font-mono text-sm uppercase underline underline-offset-4 hover:text-[#ccff00] transition-colors"
          >
            Buka judul ini di webtoons.com <ExternalLink size={15} />
          </a>
        </div>
      </div>

      {/* DAFTAR EPISODE — STRUK */}
      <div className="flex-1 pb-4">
        <div className="border-b-4 border-white mb-4 flex flex-wrap justify-between items-end gap-2 pb-2">
          <h2 className="text-3xl font-black uppercase tracking-tight">Episode</h2>
          <span className="font-mono text-sm bg-white text-black px-2 py-1">
            {episodes.length} dimuat — halaman {page}
            {detail.totalPages ? ` dari ${detail.totalPages}` : ''}
          </span>
        </div>

        {episodes.length === 0 ? (
          <p className="p-8 text-center border-4 border-dashed border-neutral-700 text-neutral-400 font-mono">
            Belum ada episode yang bisa dimuat untuk judul ini.
          </p>
        ) : (
          <ol className="flex flex-col">
            {episodes.map((ep: EpisodeItem, idx: number) => (
              <li key={`${ep.episodeNo}-${idx}`} className="border-b-2 border-dashed border-neutral-700 last:border-b-0">
                <Link
                  href={`/read?url=${encodeURIComponent(ep.url)}`}
                  className="flex items-center gap-4 bg-neutral-900 hover:bg-black hover:border-white border-2 border-transparent transition-colors p-2 group"
                >
                  <div className="w-20 aspect-video bg-black relative border border-neutral-700 shrink-0">
                    {ep.thumbnail && (
                      <Image
                        src={`/api/image-proxy?url=${encodeURIComponent(ep.thumbnail)}`}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover opacity-80 group-hover:opacity-100 transition-all"
                      />
                    )}
                    <div className="absolute top-0 left-0 bg-[#ccff00] text-black font-black text-xs px-1.5 py-0.5">
                      #{ep.episodeNo ?? idx + 1}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold uppercase truncate group-hover:text-[#ccff00] transition-colors">{ep.title || `Episode ${ep.episodeNo ?? idx + 1}`}</h3>
                    <div className="flex items-center gap-3 text-xs font-mono text-neutral-500 mt-1">
                      <span>{ep.date}</span>
                      {ep.likes && <span className="flex items-center gap-1 text-[#ff2d6b]"><Heart size={10} fill="currentColor" /> {ep.likes}</span>}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}

        {hasMore && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full mt-6 border-4 border-white py-4 font-black uppercase hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? 'Memuat...' : 'Muat episode berikutnya'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function DetailPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b-4 border-white p-4 flex items-center gap-4">
        <button onClick={() => window.history.back()} className="p-2 border-2 border-white hover:bg-white hover:text-black transition-colors" aria-label="Kembali">
          <ArrowLeft size={24} />
        </button>
        <span className="font-mono bg-[#ccff00] text-black px-2 font-bold uppercase text-xl">Detail judul</span>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:pt-8 flex flex-col">
        <Suspense fallback={<div className="font-mono text-center animate-pulse p-8">Memuat detail...</div>}>
          <DetailContent />
        </Suspense>
      </main>
    </div>
  );
}
