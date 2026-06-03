const API_BASE = "http://localhost:5000/api";

export interface MediaProgress {
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
}

export interface MediaItem {
  _id: string; // ✅ MongoDB ID
  title: string;
  category: "movie" | "series" | "manhwa" | "anime" | "book" | "cartoon";
  coverImage: string;
  description: string;
  genres: string[];
  rating: number;
  recommended: boolean;
  createdAt: string;
  updatedAt: string;
  progress: MediaProgress;
}

/* =========================
   GET ALL MEDIA
========================= */
export async function fetchMedia(
  category?: string
): Promise<MediaItem[]> {
  const params =
    category && category !== "overall"
      ? `?category=${category}`
      : "";

  const response = await fetch(`${API_BASE}/media${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch media");
  }

  return response.json();
}

/* =========================
   GET SINGLE MEDIA
========================= */
export async function fetchMediaById(
  id: string
): Promise<MediaItem> {
  const response = await fetch(`${API_BASE}/media/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch media");
  }

  return response.json();
}

/* =========================
   CREATE MEDIA
========================= */
export async function createMedia(
  data: Partial<MediaItem>
): Promise<MediaItem> {
  const response = await fetch(`${API_BASE}/media`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create media");
  }

  return response.json();
}

/* =========================
   UPDATE FULL MEDIA (PUT)
========================= */
export async function updateMedia(
  id: string,
  data: Partial<MediaItem>
): Promise<MediaItem> {
  const response = await fetch(`${API_BASE}/media/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update media");
  }

  return response.json();
}

/* =========================
   PATCH PROGRESS ONLY
========================= */
export async function patchProgress(
  id: string,
  updates: MediaProgress
): Promise<MediaItem> {
  const response = await fetch(
    `${API_BASE}/media/${id}/progress`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update progress");
  }

  return response.json();
}

/* =========================
   DELETE MEDIA
========================= */
export async function deleteMedia(
  id: string
): Promise<void> {
  const response = await fetch(`${API_BASE}/media/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete media");
  }
}