import mongoose, { Schema, Document } from "mongoose";

export interface IMediaProgress {
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

export interface IMedia extends Document {
  title: string;
  category: "movie" | "series" | "manhwa" | "anime" | "book" | "cartoon";
  coverImage: string;
  description: string;
  genres: string[];
  rating: number;
  recommended: boolean;
  createdAt: Date;
  updatedAt: Date;
  progress: IMediaProgress;
}

const MediaSchema = new Schema<IMedia>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["movie", "series", "manhwa", "anime", "book", "cartoon"],
    },
    coverImage: {
      type: String,
      default: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80",
    },
    description: {
      type: String,
      default: "No description yet.",
    },
    genres: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    recommended: {
      type: Boolean,
      default: false,
    },
    progress: {
      currentChapter: { type: Number, min: 0 },
      totalChapters: { type: Number, min: 1 },
      currentEpisode: { type: Number, min: 0 },
      totalEpisodes: { type: Number, min: 1 },
      currentSeason: { type: Number, min: 1 },
      totalSeasons: { type: Number, min: 1 },
      currentPage: { type: Number, min: 0 },
      totalPages: { type: Number, min: 1 },
      watched: { type: Boolean, default: false },
      watchPercentage: { type: Number, min: 0, max: 100, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IMedia>("Media", MediaSchema);