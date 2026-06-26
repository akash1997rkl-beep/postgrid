import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, articlesTable, beatsTable } from "@workspace/db";
import {
  GetArticlesResponse,
  CreateArticleBody,
  CreateArticleResponse,
  GetArticleParams,
  GetArticleResponse,
  UpdateArticleParams,
  UpdateArticleBody,
  UpdateArticleResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichArticle(a: typeof articlesTable.$inferSelect) {
  const [beat] = await db.select({ name: beatsTable.name }).from(beatsTable).where(eq(beatsTable.id, a.beatId));
  return {
    ...a,
    beatName: beat?.name ?? "Unknown Beat",
    senderAddress: a.senderAddress ?? null,
    postageAmount: a.postageAmount ?? null,
  };
}

router.get("/articles", async (_req, res): Promise<void> => {
  const articles = await db.select().from(articlesTable).orderBy(articlesTable.createdAt);
  const result = await Promise.all(articles.map(enrichArticle));
  res.json(GetArticlesResponse.parse(result));
});

router.post("/articles", async (req, res): Promise<void> => {
  const parsed = CreateArticleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [article] = await db.insert(articlesTable).values({
    ...parsed.data,
    status: "received",
  }).returning();

  res.status(201).json(CreateArticleResponse.parse(await enrichArticle(article)));
});

router.get("/articles/:id", async (req, res): Promise<void> => {
  const params = GetArticleParams.safeParse({ id: Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [article] = await db.select().from(articlesTable).where(eq(articlesTable.id, params.data.id));
  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  res.json(GetArticleResponse.parse(await enrichArticle(article)));
});

router.patch("/articles/:id", async (req, res): Promise<void> => {
  const params = UpdateArticleParams.safeParse({ id: Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateArticleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [article] = await db.update(articlesTable).set(parsed.data).where(eq(articlesTable.id, params.data.id)).returning();
  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  res.json(UpdateArticleResponse.parse(await enrichArticle(article)));
});

export default router;
