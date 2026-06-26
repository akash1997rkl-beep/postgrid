import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { LoginBody } from "@workspace/api-zod";

const router: IRouter = Router();

const MASTER_ADMIN_ID = 0;

function hashPassword(password: string): string {
  return Buffer.from(password + "pfmp_salt_2024").toString("base64");
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

function generateToken(userId: number): string {
  return Buffer.from(JSON.stringify({ userId, exp: Date.now() + 86400000 })).toString("base64");
}

function parseToken(token: string): { userId: number; exp: number } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString());
    if (decoded.exp < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

function getMasterAdminUser(username: string) {
  return {
    id: MASTER_ADMIN_ID,
    username,
    name: "Master Administrator",
    role: "super_admin" as const,
    email: null,
    phone: null,
    employeeId: null,
    beatId: null,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
}

export { hashPassword, parseToken };

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;

  const masterUsername = process.env.MASTER_ADMIN_USERNAME;
  const masterPassword = process.env.MASTER_ADMIN_PASSWORD;

  if (
    masterUsername &&
    masterPassword &&
    username === masterUsername &&
    password === masterPassword
  ) {
    const token = generateToken(MASTER_ADMIN_ID);
    res.json({ token, user: getMasterAdminUser(masterUsername) });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));

  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (!user.isActive) {
    res.status(401).json({ error: "Account is deactivated" });
    return;
  }

  const token = generateToken(user.id);
  const { passwordHash: _, ...safeUser } = user;

  res.json({
    token,
    user: {
      ...safeUser,
      phone: safeUser.phone ?? null,
      employeeId: safeUser.employeeId ?? null,
    },
  });
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  res.sendStatus(204);
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const token = authHeader.slice(7);
  const payload = parseToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  if (payload.userId === MASTER_ADMIN_ID) {
    const masterUsername = process.env.MASTER_ADMIN_USERNAME;
    if (!masterUsername) {
      res.status(401).json({ error: "Master admin not configured" });
      return;
    }
    res.json(getMasterAdminUser(masterUsername));
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const { passwordHash: _, ...safeUser } = user;
  res.json({
    ...safeUser,
    phone: safeUser.phone ?? null,
    employeeId: safeUser.employeeId ?? null,
  });
});

export default router;
