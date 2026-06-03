import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "./utils/cn";

type MediaCategory = "movie" | "series" | "manhwa" | "anime" | "book" | "cartoon";
type NavCategory = "overall" | MediaCategory;

type MediaProgress = {
  currentChapter?: number;
  totalChapters?: number;
  currentEpisode?: number;
  totalEpisodes?: number;
  currentSeason?: number;
  totalSeasons?: number;
  currentPage?: number;
  totalPages?: number;
  watched?: boolean;
  watchPercentage?: number;
};

type MediaItem = {
  _id: string;
  title: string;
  category: MediaCategory;
  coverImage: string;
  description: string;
  genres: string[];
  rating: number;
  recommended: boolean;
  createdAt: string;
  updatedAt: string;
  progress: MediaProgress;
};

type MediaSections = {
  recentlyUpdated: MediaItem[];
  recommendations: MediaItem[];
  random: MediaItem[];
};

type AddFormState = {
  title: string;
  category: MediaCategory;
  coverImage: string;
  description: string;
  genres: string;
  rating: number;
  currentChapter: number;
  totalChapters: number;
  currentEpisode: number;
  totalEpisodes: number;
  currentSeason: number;
  totalSeasons: number;
  currentPage: number;
  totalPages: number;
  watched: boolean;
  watchPercentage: number;
};

const navItems: Array<{ label: string; value: NavCategory }> = [
  { label: "Overall", value: "overall" },
  { label: "Movies", value: "movie" },
  { label: "Series", value: "series" },
  { label: "Manhwa", value: "manhwa" },
  { label: "Anime", value: "anime" },
  { label: "Books", value: "book" },
  { label: "Cartoons", value: "cartoon" },
];

const categoryLabel: Record<MediaCategory, string> = {
  manhwa: "MANHWA",
  anime: "ANIME",
  series: "SERIES",
  movie: "MOVIE",
  book: "BOOK",
  cartoon: "CARTOON",
};

const defaultForm: AddFormState = {
  title: "",
  category: "manhwa",
  coverImage: "",
  description: "",
  genres: "",
  rating: 8,
  currentChapter: 1,
  totalChapters: 100,
  currentEpisode: 1,
  totalEpisodes: 12,
  currentSeason: 1,
  totalSeasons: 1,
  currentPage: 1,
  totalPages: 300,
  watched: false,
  watchPercentage: 0,
};

const emptySections: MediaSections = {
  recentlyUpdated: [],
  recommendations: [],
  random: [],
};

const API_BASE = "http://localhost:5000/api";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function buildProgress(form: AddFormState): MediaProgress {
  if (form.category === "manhwa") {
    return {
      currentChapter: clamp(form.currentChapter, 0, form.totalChapters),
      totalChapters: Math.max(form.totalChapters, 1),
    };
  }

  if (form.category === "anime" || form.category === "cartoon") {
    return {
      currentEpisode: clamp(form.currentEpisode, 0, form.totalEpisodes),
      totalEpisodes: Math.max(form.totalEpisodes, 1),
      currentSeason: clamp(form.currentSeason, 1, form.totalSeasons),
      totalSeasons: Math.max(form.totalSeasons, 1),
    };
  }

  if (form.category === "series") {
    return {
      currentSeason: clamp(form.currentSeason, 1, form.totalSeasons),
      currentEpisode: clamp(form.currentEpisode, 0, form.totalEpisodes),
      totalSeasons: Math.max(form.totalSeasons, 1),
      totalEpisodes: Math.max(form.totalEpisodes, 1),
    };
  }

  if (form.category === "book") {
    return {
      currentPage: clamp(form.currentPage, 0, form.totalPages),
      totalPages: Math.max(form.totalPages, 1),
    };
  }

  return {
    watched: form.watched,
    watchPercentage: clamp(form.watchPercentage, 0, 100),
  };
}

function formatProgress(item: MediaItem) {
  const { progress } = item;

  if (item.category === "manhwa") {
    return `Chapter ${progress.currentChapter ?? 0} / ${progress.totalChapters ?? 0}`;
  }

  if (item.category === "anime") {
    return `Season ${progress.currentSeason ?? 1} - Episode ${progress.currentEpisode ?? 0} / ${progress.totalEpisodes ?? 0}`;
  }

  if (item.category === "series") {
    return `Season ${progress.currentSeason ?? 1} - Episode ${progress.currentEpisode ?? 0} / ${progress.totalEpisodes ?? 0}`;
  }

  if (item.category === "book") {
    return `Page ${progress.currentPage ?? 0} / ${progress.totalPages ?? 0}`;
  }

  if (item.category === "cartoon") {
    return `Season ${progress.currentSeason ?? 1} - Episode ${progress.currentEpisode ?? 0} / ${progress.totalEpisodes ?? 0}`;
  }

  return progress.watched ? "Watched" : `Progress ${progress.watchPercentage ?? 0}%`;
}

async function fetchSections(category: NavCategory) {
  const response = await fetch(`${API_BASE}/media/sections?category=${category}`);
  if (!response.ok) {
    throw new Error("Failed to load sections");
  }

  return (await response.json()) as MediaSections;
}

async function createMediaItem(payload: Omit<MediaItem, "_id" | "createdAt" | "updatedAt">) {
  const response = await fetch(`${API_BASE}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });


  if (!response.ok) {
    const body = (await response.json()) as { message?: string };
    throw new Error(body.message ?? "Failed to save media");
  }

  return (await response.json()) as MediaItem;
}


async function updateMediaItem(
  id: string,
  payload: any
) {
  const response = await fetch(
    `${API_BASE}/media/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update");
  }

  return response.json();
}

async function patchMediaProgress(id: string, updates: MediaProgress) {
  const response = await fetch(`${API_BASE}/media/${id}/progress`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const body = (await response.json()) as { message?: string };
    throw new Error(body.message ?? "Failed to patch progress");
  }

  return (await response.json()) as MediaItem;
}

function patchSectionsWithItem(sections: MediaSections, item: MediaItem): MediaSections {
  const patchList = (list: MediaItem[]) => list.map((entry) => (entry._id === item._id ? item : entry));
  return {
    recentlyUpdated: patchList(sections.recentlyUpdated),
    recommendations: patchList(sections.recommendations),
    random: patchList(sections.random),
  };
}

function ProgressButtons({
  item,
  onPatch,
}: {
  item: MediaItem;
  onPatch: (id: string, updates: MediaProgress) => void;
}) {
  const progress = item.progress;

  if (item.category === "manhwa") {
    const current = progress.currentChapter ?? 0;
    const total = progress.totalChapters ?? 0;
    return (
      <div className="flex items-center gap-2 text-sm">
        <button className="progress-btn" onClick={() => onPatch(item._id, { currentChapter: clamp(current - 1, 0, total) })}>
          -
        </button>
        <span className="min-w-20 text-center">{current}</span>
        <button className="progress-btn" onClick={() => onPatch(item._id, { currentChapter: clamp(current + 1, 0, total) })}>
          +
        </button>
      </div>
    );
  }

  if (item.category === "series" || item.category === "anime" || item.category === "cartoon") {
    const episode = progress.currentEpisode ?? 0;
    const totalEpisodes = progress.totalEpisodes ?? 0;
    const season = progress.currentSeason ?? 1;
    const totalSeasons = progress.totalSeasons ?? 1;

    return (
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-16 text-slate-500">Episode</span>
          <button className="progress-btn" onClick={() => onPatch(item._id, { currentEpisode: clamp(episode - 1, 0, totalEpisodes) })}>
            -
          </button>
          <span className="min-w-20 text-center">{episode}</span>
          <button className="progress-btn" onClick={() => onPatch(item._id, { currentEpisode: clamp(episode + 1, 0, totalEpisodes) })}>
            +
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-16 text-slate-500">Season</span>
          <button className="progress-btn" onClick={() => onPatch(item._id, { currentSeason: clamp(season - 1, 1, totalSeasons) })}>
            -
          </button>
          <span className="min-w-20 text-center">{season}</span>
          <button className="progress-btn" onClick={() => onPatch(item._id, { currentSeason: clamp(season + 1, 1, totalSeasons) })}>
            +
          </button>
        </div>
      </div>
    );
  }

  if (item.category === "book") {
    const page = progress.currentPage ?? 0;
    const total = progress.totalPages ?? 0;
    return (
      <div className="flex items-center gap-2 text-sm">
        <button className="progress-btn" onClick={() => onPatch(item._id, { currentPage: clamp(page - 1, 0, total) })}>
          -
        </button>
        <span className="min-w-20 text-center">{page}</span>
        <button className="progress-btn" onClick={() => onPatch(item._id, { currentPage: clamp(page + 1, 0, total) })}>
          +
        </button>
      </div>
    );
  }

  const watched = progress.watched ?? false;
  const percentage = progress.watchPercentage ?? 0;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <button className="progress-btn" onClick={() => onPatch(item._id, { watchPercentage: clamp(percentage - 5, 0, 100), watched: false })}>
        -5%
      </button>
      <span className="min-w-16 text-center">{percentage}%</span>
      <button className="progress-btn" onClick={() => onPatch(item._id, { watchPercentage: clamp(percentage + 5, 0, 100), watched: percentage + 5 >= 100 })}>
        +5%
      </button>
      <button
        className={cn(
          "rounded-full border px-3 py-1 text-xs font-medium transition",
          watched ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 text-slate-700 hover:border-slate-400"
        )}
        onClick={() => onPatch(item._id, { watched: !watched, watchPercentage: !watched ? 100 : percentage })}
      >
        {watched ? "Watched" : "Mark Watched"}
      </button>
    </div>
  );
}

function MediaCarousel({
  title,
  items,
  onPatch,
  onEdit,
  onShow,
}: {
  title: string;
  items: MediaItem[];
  onPatch: (
    id: string,
    updates: MediaProgress
  ) => void;
  onEdit: (item: MediaItem) => void;
  onShow: (item: MediaItem) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const move = (delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <div className="flex gap-2">
          <button className="carousel-nav" onClick={() => move(-360)}>
            Prev
          </button>
          <button className="carousel-nav" onClick={() => move(360)}>
            Next
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {items.map((item) => (
          <article
            key={item._id}
            className="fade-in-up group min-w-80 snap-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
          >
            <img src={item.coverImage} alt={item.title} className="h-44 w-full object-cover" />
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="line-clamp-1 text-base font-semibold text-slate-900">{item.title}</h3>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold tracking-wide text-slate-700">
                  {categoryLabel[item.category]}
                </span>
              </div>
              <p className="line-clamp-2 text-sm text-slate-600">{item.description}</p>
              <p className="text-sm font-medium text-slate-900">{formatProgress(item)}</p>
              <ProgressButtons item={item} onPatch={onPatch} />
            </div>
<div className="space-y-3 p-4">
<div className="flex gap-2 pt-2">
 <button
  className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
  onClick={() => onEdit(item)}
>
  Edit
</button>

<button
  className="rounded-full bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-500"
  onClick={() => onShow(item)}
>
  Show All
</button>
</div>
</div>
          </article>
        ))}
        {items.length === 0 && <p className="p-2 text-sm text-slate-500">No items for this section yet.</p>}
      </div>
    </section>
  );
}

export default function App() {
  const [activeCategory, setActiveCategory] = useState<NavCategory>("overall");
  const [sections, setSections] = useState<MediaSections>(emptySections);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<AddFormState>(defaultForm);
const [editingId, setEditingId] =
  useState<string | null>(null);
  const [statusText, setStatusText] = useState("MongoDB sync idle");
const [selectedMedia, setSelectedMedia] =
  useState<MediaItem | null>(null);


const handleEdit = (item: MediaItem) => {
  setEditingId(item._id);

  setForm({
    title: item.title,
    category: item.category,
    coverImage: item.coverImage,
    description: item.description,
    genres: item.genres.join(", "),
    rating: item.rating,

    currentChapter:
      item.progress.currentChapter || 1,

    totalChapters:
      item.progress.totalChapters || 100,

    currentEpisode:
      item.progress.currentEpisode || 1,

    totalEpisodes:
      item.progress.totalEpisodes || 12,

    currentSeason:
      item.progress.currentSeason || 1,

    totalSeasons:
      item.progress.totalSeasons || 1,

    currentPage:
      item.progress.currentPage || 1,

    totalPages:
      item.progress.totalPages || 300,

    watched:
      item.progress.watched || false,

    watchPercentage:
      item.progress.watchPercentage || 0,
  });

  setAddOpen(true);
};

const handleShow = (
  item: MediaItem
) => {
  setSelectedMedia(item);
};

  const refreshSections = async (category: NavCategory) => {
    setLoading(true);
    try {
      const data = await fetchSections(category);
      setSections(data);
      setStatusText(`GET /media/sections?category=${category}`);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Unable to load data");
      setSections(emptySections);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshSections(activeCategory);
  }, [activeCategory]);

  const onPatchProgress = async (id: string, updates: MediaProgress) => {
    const nowISO = new Date().toISOString();

    setSections((current) => {
      const patchList = (list: MediaItem[]) =>
        list.map((item) =>
          item._id === id
            ? {
                ...item,
                progress: { ...item.progress, ...updates },
                updatedAt: nowISO,
              }
            : item
        );

      return {
        recentlyUpdated: patchList(current.recentlyUpdated),
        recommendations: patchList(current.recommendations),
        random: patchList(current.random),
      };
    });

    setStatusText(`PATCH /media/${id}/progress ${JSON.stringify(updates)}`);

    try {
      const updated = await patchMediaProgress(id, updates);
if (selectedMedia?._id === updated._id) {
  setSelectedMedia(updated);
}
      setSections((current) => patchSectionsWithItem(current, updated));
      setStatusText(`PATCH /media/${id}/progress -> MongoDB updated`);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Patch failed");
      void refreshSections(activeCategory);
    }
  };

  const onSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim()) {
      return;
    }

    const payload = {
      title: form.title.trim(),
      category: form.category,
      coverImage:
        form.coverImage.trim() ||
        "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80",
      description: form.description.trim() || "No description yet.",
      genres: form.genres
        .split(",")
        .map((genre) => genre.trim())
        .filter(Boolean),
      rating: form.rating,
      recommended: form.rating >= 8.5,
      progress: buildProgress(form),
    };

    try {
  if (editingId) {
    await updateMediaItem(
      editingId,
      payload
    );

    setStatusText("Media updated");
    setEditingId(null);
  } else {
    const created =
      await createMediaItem(payload);

    setStatusText(
      `POST /media -> ${created.title} saved`
    );
  }

  setAddOpen(false);
  setForm(defaultForm);

  await refreshSections(
    activeCategory
  );
} catch (error) {
  setStatusText(
    error instanceof Error
      ? error.message
      : "Save failed"
  );
}
};

  const pageTitle = useMemo(() => navItems.find((item) => item.value === activeCategory)?.label ?? "Overall", [activeCategory]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Media Tracker</p>
            <h1 className="text-xl font-bold">Media Flow DB</h1>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            + Add Card
          </button>
        </div>
        <nav className="no-scrollbar mx-auto flex w-full max-w-7xl gap-2 overflow-x-auto px-6 pb-4">
          {navItems.map((item) => (
            <button
              key={item.value}
              onClick={() => setActiveCategory(item.value)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                activeCategory === item.value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main key={activeCategory} className="fade-in-up mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8">
        <section className="space-y-2">
          <h2 className="text-3xl font-semibold">{pageTitle}</h2>
          <p className="max-w-2xl text-sm text-slate-600">
            Unified Media collection with shared fields and category-specific progress. Quick controls patch MongoDB directly.
          </p>
          <p className="text-xs text-slate-500">{loading ? "Loading..." : statusText}</p>
        </section>

        <MediaCarousel
  title="Recently Updated"
  items={sections.recentlyUpdated}
  onPatch={onPatchProgress}
  onEdit={handleEdit}
  onShow={handleShow}
/>

<MediaCarousel
  title="Recommendations"
  items={sections.recommendations}
  onPatch={onPatchProgress}
  onEdit={handleEdit}
  onShow={handleShow}
/>

<MediaCarousel
  title="Random"
  items={sections.random}
  onPatch={onPatchProgress}
  onEdit={handleEdit}
  onShow={handleShow}
/>
      </main>

      <div className={cn("fixed inset-0 z-30 transition", addOpen ? "pointer-events-auto" : "pointer-events-none")}>
        <div
          className={cn(
            "absolute inset-0 bg-slate-900/30 transition-opacity",
            addOpen ? "opacity-100" : "opacity-0"
          )}
         onClick={() => {
  setAddOpen(false);
  setEditingId(null);
  setForm(defaultForm);
}}
        />
        <aside
          className={cn(
            "absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl transition-transform duration-300",
            addOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="mb-6 flex items-center justify-between">
           <h3 className="text-xl font-semibold">
  {editingId ? "Edit Media" : "Add Card"}
</h3>
            <button className="rounded-full bg-red-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700" onClick={() => {
  setAddOpen(false);
  setEditingId(null);
  setForm(defaultForm);
}}>
              Close
            </button>
          </div>
          <form className="space-y-4" onSubmit={onSave}>
            <label className="block space-y-1 text-sm">
              <span>Category</span>
              <select
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as MediaCategory }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              >
                <option value="movie">Movies</option>
                <option value="series">Series</option>
                <option value="manhwa">Manhwa</option>
                <option value="anime">Anime</option>
                <option value="book">Books</option>
                <option value="cartoon">Cartoons</option>
              </select>
            </label>

            <label className="block space-y-1 text-sm">
              <span>Title</span>
              <input
                required
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span>Cover</span>
              <input
                value={form.coverImage}
                onChange={(event) => setForm((current) => ({ ...current, coverImage: event.target.value }))}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span>Description</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                className="min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span>Genres (comma separated)</span>
              <input
                value={form.genres}
                onChange={(event) => setForm((current) => ({ ...current, genres: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span>Rating</span>
              <input
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={form.rating}
                onChange={(event) => setForm((current) => ({ ...current, rating: Number(event.target.value) }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>

            {form.category === "manhwa" && (
              <>
                <label className="block space-y-1 text-sm">
                  <span>Current Chapter</span>
                  <input
                    type="number"
                    min={0}
                    value={form.currentChapter}
                    onChange={(event) => setForm((current) => ({ ...current, currentChapter: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span>Total Chapters</span>
                  <input
                    type="number"
                    min={1}
                    value={form.totalChapters}
                    onChange={(event) => setForm((current) => ({ ...current, totalChapters: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>
              </>
            )}

            {(form.category === "anime" || form.category === "cartoon") && (
              <>
                <label className="block space-y-1 text-sm">
                  <span>Current Episode</span>
                  <input
                    type="number"
                    min={0}
                    value={form.currentEpisode}
                    onChange={(event) => setForm((current) => ({ ...current, currentEpisode: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span>Total Episodes</span>
                  <input
                    type="number"
                    min={1}
                    value={form.totalEpisodes}
                    onChange={(event) => setForm((current) => ({ ...current, totalEpisodes: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span>Current Season</span>
                  <input
                    type="number"
                    min={1}
                    value={form.currentSeason}
                    onChange={(event) => setForm((current) => ({ ...current, currentSeason: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span>Total Seasons</span>
                  <input
                    type="number"
                    min={1}
                    value={form.totalSeasons}
                    onChange={(event) => setForm((current) => ({ ...current, totalSeasons: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>
              </>
            )}

            {form.category === "series" && (
              <>
                <label className="block space-y-1 text-sm">
                  <span>Current Season</span>
                  <input
                    type="number"
                    min={1}
                    value={form.currentSeason}
                    onChange={(event) => setForm((current) => ({ ...current, currentSeason: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span>Current Episode</span>
                  <input
                    type="number"
                    min={0}
                    value={form.currentEpisode}
                    onChange={(event) => setForm((current) => ({ ...current, currentEpisode: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span>Total Seasons</span>
                  <input
                    type="number"
                    min={1}
                    value={form.totalSeasons}
                    onChange={(event) => setForm((current) => ({ ...current, totalSeasons: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span>Total Episodes</span>
                  <input
                    type="number"
                    min={1}
                    value={form.totalEpisodes}
                    onChange={(event) => setForm((current) => ({ ...current, totalEpisodes: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>
              </>
            )}

            {form.category === "book" && (
              <>
                <label className="block space-y-1 text-sm">
                  <span>Current Page</span>
                  <input
                    type="number"
                    min={0}
                    value={form.currentPage}
                    onChange={(event) => setForm((current) => ({ ...current, currentPage: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span>Total Pages</span>
                  <input
                    type="number"
                    min={1}
                    value={form.totalPages}
                    onChange={(event) => setForm((current) => ({ ...current, totalPages: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>
              </>
            )}

            {form.category === "movie" && (
              <>
                <label className="block space-y-1 text-sm">
                  <span>Watch Percentage</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.watchPercentage}
                    onChange={(event) => setForm((current) => ({ ...current, watchPercentage: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.watched}
                    onChange={(event) => setForm((current) => ({ ...current, watched: event.target.checked }))}
                  />
                  Watched
                </label>
              </>
            )}

            <button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
               {editingId ? "Update Media" : "Save"}
            </button>
          </form>
        </aside>
      </div>
{selectedMedia && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6">

      <img
        src={selectedMedia.coverImage}
        alt={selectedMedia.title}
        className="mb-4 h-96 w-full rounded-xl object-contain"
      />

      <h2 className="mb-4 text-3xl font-bold">
        {selectedMedia.title}
      </h2>

      <p className="mt-2 rounded-lg bg-slate-100 px-4 py-2">
  <span className="font-semibold text-slate-700">
    Progress:
  </span>{" "}
  {formatProgress(selectedMedia)}
</p>

<p className="mt-2 rounded-lg bg-slate-100 px-4 py-2">
  <span className="font-semibold text-slate-700">
    Category:
  </span>{" "}
  {selectedMedia.category}
</p>

<p className="mt-2 rounded-lg bg-slate-100 px-4 py-2">
  <span className="font-semibold text-slate-700">
    Rating:
  </span>{" "}
  <span className="font-bold text-yellow-600">
    ⭐ {selectedMedia.rating}
  </span>
</p>

<p className="mt-2 rounded-lg bg-slate-100 px-4 py-2">
  <span className="font-semibold text-slate-700">
    Genres:
  </span>{" "}
  {selectedMedia.genres.join(", ")}
</p>

<p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 leading-relaxed text-slate-700">
  {selectedMedia.description}
</p>

      <button
        onClick={() =>
          setSelectedMedia(null)
        }
        className="mt-6 rounded-full bg-red-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
      >
        Close
      </button>

    </div>
  </div>
)}
    </div>
  );
}