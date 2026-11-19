import * as cheerio from "cheerio";

// Scraper webtoons.com (read-only, tanpa login, tanpa API key).
// Semua request lewat CORS proxy publik karena webtoons.com menolak
// fetch lintas-origin dari browser; server (Route Handler) yang memanggil.
// Pakai fetch bawaan (bukan axios) supaya lib ini jalan di mana saja:
// Node (dev/CI), maupun Workers lewat @opennextjs/cloudflare.
const WEBTOONS_BASE = "https://www.webtoons.com";
const CORS_PROXY = "https://cors.siputzx.my.id/";
const FETCH_TIMEOUT_MS = 25000;

/** URL detail/episode yang sah: hanya host webtoons.com. */
export const isWebtoonsUrl = (raw: string): boolean => {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && (u.hostname === "webtoons.com" || u.hostname.endsWith(".webtoons.com"));
  } catch {
    return false;
  }
};


export interface WebtoonItem {
  titleNo: number;
  title: string;
  author?: string | null;
  thumbnail: string | null;
  genre: string | null;
  section?: "canvas" | "originals";
  url: string;
  likes?: string | null;
}

export interface EpisodeItem {
  episodeNo: number | null;
  title: string;
  thumbnail: string | null;
  date: string | null;
  likes: string | null;
  url: string;
}

export interface WebtoonDetail {
  titleNo: number | null;
  title: string | null;
  author: string | null;
  synopsis: string | null;
  genre: string | null;
  day: string | null;
  status: string | null;
  rating: number | null;
  subscribers: string | null;
  thumbnail: string | null;
  url: string;
}

export interface SearchResult {
  query: string;
  count: number;
  originals: WebtoonItem[];
  canvas: WebtoonItem[];
  items: WebtoonItem[];
}

export interface TrendingResult {
  day: string;
  sourceUrl: string;
  count: number;
  items: WebtoonItem[];
}

export interface EpisodesResult extends WebtoonDetail {
  page: number;
  totalPages: number;
  hasNext: boolean;
  count: number;
  episodesList: EpisodeItem[];
}

const fetchHtml = async (path: string) => {
  let url = path.startsWith("http") ? path : `${WEBTOONS_BASE}${path}`;
  url = `${CORS_PROXY}${url}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} dari ${url}`);
    }
    return await res.text();
  } catch (error) {
    console.error("fetchHtml error", error);
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

const titleNoFromUrl = (url: string) => {
  const m = String(url).match(/[?&]title_no=(\d+)/);
  return m ? Number(m[1]) : null;
};

export const searchWebtoons = async (query: string, limit: number = 20): Promise<SearchResult> => {
  const html = await fetchHtml(`/id/search?keyword=${encodeURIComponent(query)}`);
  const $ = cheerio.load(html);
  const items: WebtoonItem[] = [];

  $("a[href*='/list?title_no=']").each((_, el) => {
    if (items.length >= limit) return false;
    const $a = $(el);
    const href = $a.attr("href") ?? "";
    if (!href) return;
    const absUrl = href.startsWith("http") ? href : `${WEBTOONS_BASE}${href}`;
    const titleNo = titleNoFromUrl(absUrl);
    if (!titleNo) return;
    const title =
      $a.find("strong.title, .info_text .title, p.subj, .subj").first().text().trim() ||
      $a.attr("title")?.trim() || "";
    const author =
      $a.find(".info_text .author, div.author, .author, .by").first().text().trim();
    const thumb = $a.find("img").first().attr("src") ?? null;
    const isCanvas = absUrl.includes("/canvas/");
    const genreMatch = absUrl.match(/\/id\/([^/]+)\/[^/]+\/list/);
    const genre = !isCanvas && genreMatch ? genreMatch[1] : null;
    items.push({
      titleNo, title, author: author || null, thumbnail: thumb, genre,
      section: isCanvas ? "canvas" : "originals",
      url: absUrl.split("&webtoon-platform-redirect")[0],
    });
  });

  const seen = new Set();
  const unique = items.filter((it) => {
    const key = `${it.section}:${it.titleNo}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    query, count: unique.length,
    originals: unique.filter((i) => i.section === "originals"),
    canvas: unique.filter((i) => i.section === "canvas"),
    items: unique,
  };
};

export const parseDetail = ($: cheerio.CheerioAPI, sourceUrl: string): WebtoonDetail => {
  const title = $("h1.subj, h3.subj, .info .subj").first().text().trim() ||
    $('meta[property="og:title"]').attr("content") || null;
  // .author_area ikut menarik teks "Informasi Kreator" di bawah nama —
  // ambil baris pertama yang tidak kosong saja.
  const authorRaw = $(".author_area, .ly_creator_in .author, .author").first().text() || "";
  const author = authorRaw.split("\n").map((t) => t.trim()).find((t) => t.length > 0) || null;
  const synopsis = $("p.summary, .detail_body .summary").first().text().trim() ||
    $('meta[property="og:description"]').attr("content") || null;
  const genre =
    $("h2.genre, p.genre").first().text().trim() ||
    sourceUrl.match(/\/id\/([^/]+)\//)?.[1] ||
    null;
  // day_info mentah: "UPUpdate KAMIS" (span UP + teks) -> "Update KAMIS".
  const day = $("p.day_info, .day_info").first().text().replace(/\s+/g, " ").trim().replace(/^UP+/, "") || null;
  const status = /completed|tamat|selesai/i.test(day ?? "") ? "COMPLETED" : /(every|setiap|UP)/i.test(day ?? "") ? "ONGOING" : null;
  const ratingText = $("em#_starScoreAverage, .grade_area .grade_num").first().text().trim() || null;
  const rating = ratingText ? parseFloat(ratingText) || null : null;
  // .grade_area punya dua <em class="cnt">: view lalu subscribe.
  // Ambil yang sebelahan dengan ikon subscribe, bukan view count.
  let subscribers: string | null = null;
  $(".grade_area li").each((_, li) => {
    if (!subscribers && $(li).find(".ico_subscribe").length > 0) {
      subscribers = $(li).find("em.cnt").first().text().trim() || null;
    }
  });
  subscribers = subscribers || $(".subscribe em.cnt").first().text().trim() || null;
  // og:image = poster judul (persegi). .detail_bg justru banner lebar
  // (mis. Landing_Page_Character 1200x240) yang tampak hitam di kotak 3:4.
  const thumbnail = $('meta[property="og:image"]').attr("content") ||
    $(".detail_header .thmb img").first().attr("src") ||
    $(".detail_bg img").first().attr("src") || null;

  return {
    titleNo: titleNoFromUrl(sourceUrl),
    title, author, synopsis, genre, day, status, rating, subscribers, thumbnail,
    url: sourceUrl,
  };
};

export const getDetail = async (url: string): Promise<WebtoonDetail> => {
  const html = await fetchHtml(url);
  return parseDetail(cheerio.load(html), url);
};

export const getEpisodes = async (url: string, page = 1): Promise<EpisodesResult> => {
  const sep = url.includes("?") ? "&" : "?";
  const fullUrl = `${url}${sep}page=${page}`;
  const html = await fetchHtml(fullUrl);
  const $ = cheerio.load(html);
  const list: EpisodeItem[] = [];

  $("#_listUl > li, ul#_listUl > li").each((_, el) => {
    const $li = $(el);
    const $a = $li.find("a").first();
    const href = $a.attr("href") ?? "";
    if (!href) return;
    const epUrl = href.startsWith("http") ? href : `${WEBTOONS_BASE}${href}`;
    const epNo = Number($li.attr("data-episode-no")) || Number(epUrl.match(/episode_no=(\d+)/)?.[1]) || null;
    const epTitle = $a.find(".subj span, .subj").first().text().trim() || $a.attr("title")?.trim() || "";
    const thumb = $a.find(".thmb img").first().attr("src") ?? null;
    const date = $a.find(".date").first().text().trim() || null;
    const likeText = $li.find("em._likeitNumViewArea, .like_area").first().text().trim();
    const likes = likeText.match(/[\d.,]+/)?.[0] || null;
    list.push({ episodeNo: epNo, title: epTitle, thumbnail: thumb, date, likes, url: epUrl });
  });

  let totalPages = page;
  $("div.paginate a, .paginate a").each((_, el) => {
    const t = Number($(el).text().trim());
    if (Number.isFinite(t) && t > totalPages) totalPages = t;
  });

  const meta = parseDetail($, url);
  return { ...meta, page, totalPages, hasNext: page < totalPages, count: list.length, episodesList: list };
};

export const TRENDING_DAYS = [
  "daily", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "completed",
] as const;

export const getTrending = async (day: string): Promise<TrendingResult> => {
  const d = (day || "daily").toLowerCase();
  const path = d === "daily" || d === "trending"
    ? "/id/dailySchedule"
    : d === "completed" ? "/id/originals/completed" : `/id/originals/${d}`;
  const sourceUrl = `${WEBTOONS_BASE}${path}`;
  const html = await fetchHtml(sourceUrl);
  const $ = cheerio.load(html);
  const items: WebtoonItem[] = [];

  $("a[href*='/list?title_no=']").each((_, el) => {
    const $a = $(el);
    const href = $a.attr("href") ?? "";
    if (!href) return;
    const absUrl = href.startsWith("http") ? href : `${WEBTOONS_BASE}${href}`;
    const titleNo = titleNoFromUrl(absUrl);
    if (!titleNo) return;
    const title =
      $a.find("strong.title, .info_text .title, .subj, p.subj").first().text().trim() ||
      $a.attr("title")?.trim() || "";
    const thumb = $a.find("img").first().attr("src") ?? null;
    const genreMatch = absUrl.match(/\/id\/([^/]+)\/[^/]+\/list/);
    const genre =
      $a.find(".info_text .genre").first().text().trim() ||
      (genreMatch && genreMatch[1] !== "canvas" ? genreMatch[1] : null);
    const likes =
      $a.find(".view_count").first().text().trim() ||
      $a.find(".grade_area em, .like_area em, .grade_num").first().text().trim() || null;
    items.push({
      titleNo, title, thumbnail: thumb, genre, likes,
      url: absUrl.split("&webtoon-platform-redirect")[0],
    });
  });

  const seen = new Set();
  const unique = items.filter((it) => {
    if (seen.has(it.titleNo)) return false;
    seen.add(it.titleNo);
    return true;
  });

  return { day: d, sourceUrl, count: unique.length, items: unique };
};

export const getEpisodeImages = async (url: string): Promise<string[]> => {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const images: string[] = [];

  $("#_imageList img").each((_, el) => {
    const src = $(el).attr("data-url") || $(el).attr("src");
    if (src) images.push(src);
  });

  return images;
};
