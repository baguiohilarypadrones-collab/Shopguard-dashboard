import express, { Request, Response } from "express";
import Media from "../models/Media";

const router = express.Router();

/* ======================================================
   GET /api/media
   Get all media (optional ?category=movie)
====================================================== */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    const query =
      category && category !== "overall"
        ? { category }
        : {};

    const media = await Media.find(query).sort({
      updatedAt: -1,
    });

    res.json(media);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch media" });
  }
});


router.get("/sections", async (req, res) => {
  try {
    const { category } = req.query;

    const filter =
      category && category !== "overall"
        ? { category }
        : {};

    const allMedia = await Media.find(filter);

    const recentlyUpdated = [...allMedia]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() -
          new Date(a.updatedAt).getTime()
      )
      .slice(0, 8);

    // Get 3 most recently updated
const recentTop3 = recentlyUpdated.slice(0, 3);

// Collect genres from top 3
const recentGenres = recentTop3.flatMap(
  (item) => item.genres || []
);

// Find similar genre media
const recommendations = allMedia
  .filter((item) => {
    if (
      recentTop3.some(
        (recent) =>
          recent._id.toString() === item._id.toString()
      )
    ) {
      return false;
    }

    return item.genres?.some((genre) =>
      recentGenres.includes(genre)
    );
  })
  .sort((a, b) => b.rating - a.rating)
  .slice(0, 8);

    const random = [...allMedia]
      .sort(() => Math.random() - 0.5)
      .slice(0, 8);

    res.json({
      recentlyUpdated,
      recommendations,
      random,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to load sections",
    });
  }
});

/* ======================================================
   GET /api/media/category/:category
   Get media by category with optional sorting
   ?sort=recently-updated | recommended
====================================================== */
router.get(
  "/category/:category",
  async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const { sort } = req.query;

      let sortQuery: Record<string, any> = {};

      if (sort === "recently-updated") {
        sortQuery = { updatedAt: -1 };
      } else if (sort === "recommended") {
        sortQuery = { recommended: -1, rating: -1 };
      }

      const media = await Media.find({ category }).sort(sortQuery);

      res.json(media);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch media" });
    }
  }
);

/* ======================================================
   GET /api/media/:id
   Get single media item
====================================================== */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({ error: "Media not found" });
    }

    res.json(media);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch media" });
  }
});

/* ======================================================
   POST /api/media
   Create new media
====================================================== */
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      title,
      category,
      coverImage,
      description,
      genres,
      rating,
      progress,
    } = req.body;


const existing = await Media.findOne({
  title,
  category,
});

if (existing) {
  return res.status(400).json({
    error: "Media already exists",
  });
}

    const media = await Media.create({
      title,
      category,
      coverImage,
      description,
      genres,
      rating,
      recommended: rating >= 8.5,
      progress,
    });

    res.status(201).json(media);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create media" });
  }
});

/* ======================================================
   PUT /api/media/:id
   Update entire media item
====================================================== */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const {
      title,
      category,
      coverImage,
      description,
      genres,
      rating,
      progress,
    } = req.body;

    const media = await Media.findByIdAndUpdate(
      req.params.id,
      {
        title,
        category,
        coverImage,
        description,
        genres,
        rating,
        recommended: rating >= 8.5,
        progress,
      },
      { new: true, runValidators: true }
    );

    if (!media) {
      return res.status(404).json({ error: "Media not found" });
    }

    res.json(media);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update media" });
  }
});

/* ======================================================
   PATCH /api/media/:id/progress
   Update only progress fields
====================================================== */
router.patch(
  "/:id/progress",
  async (req: Request, res: Response) => {
    try {
      const updates = req.body;

      const progressUpdates: Record<string, any> = {};

      for (const [key, value] of Object.entries(updates)) {
        progressUpdates[`progress.${key}`] = value;
      }

      const media = await Media.findByIdAndUpdate(
        req.params.id,
        { $set: progressUpdates },
        { new: true, runValidators: true }
      );

      if (!media) {
        return res.status(404).json({ error: "Media not found" });
      }

      res.json(media);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update progress" });
    }
  }
);

/* ======================================================
   DELETE /api/media/:id
====================================================== */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const media = await Media.findByIdAndDelete(req.params.id);

    if (!media) {
      return res.status(404).json({ error: "Media not found" });
    }

    res.json({ message: "Media deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete media" });
  }
});

export default router;