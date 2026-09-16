import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db, ensureDbReady } from "@/db";
import { sessions, users, type User } from "@/db/schema";

export const SESSION_COOKIE = "sp_session";
const SESSION_DAYS = 30;

const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  process.env.JWT_SECRET ||
  "focusnest_student_study_session_secret_key_2026_production";

function signToken(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", AUTH_SECRET).update(data).digest("base64url");
  return `${data}.${signature}`;
}

function verifyToken(tokenString: string): any | null {
  if (!tokenString || typeof tokenString !== "string") return null;
  const parts = tokenString.split(".");
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  try {
    const expectedSignature = crypto
      .createHmac("sha256", AUTH_SECRET)
      .update(data)
      .digest("base64url");
    if (signature.length !== expectedSignature.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (payload.exp && payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userOrId: string | User) {
  let user: User | null = null;
  let userId: string;

  if (typeof userOrId === "string") {
    userId = userOrId;
  } else {
    user = userOrId;
    userId = user.id;
  }

  await ensureDbReady();

  if (!user) {
    try {
      const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (u) user = u;
    } catch (err) {
      console.warn("Could not find user in createSession:", err);
    }
  }

  const rawToken = crypto.randomUUID() + crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  try {
    await db.insert(sessions).values({ token: rawToken, userId, expiresAt });
  } catch (err) {
    console.warn("Could not insert session into db:", err);
  }

  const payload = {
    userId,
    name: user?.name ?? "Student",
    email: user?.email ?? "",
    classGrade: user?.classGrade ?? "Class 11",
    examTarget: user?.examTarget ?? "JEE Main",
    token: rawToken,
    exp: expiresAt.getTime(),
  };

  return signToken(payload);
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  await ensureDbReady();

  // 1. Signed tamper-proof token verification (instant and resilient across serverless instances)
  const payload = verifyToken(token);
  if (payload && payload.userId) {
    try {
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1);
      if (dbUser) return dbUser;
    } catch (err) {
      console.warn("getCurrentUser DB query failed, using token payload:", err);
    }

    // Resilient fallback if DB connection has cold-start latency
    return {
      id: payload.userId,
      name: payload.name || "Student",
      email: payload.email || "",
      passwordHash: "",
      classGrade: payload.classGrade || "Class 11",
      examTarget: payload.examTarget || "JEE Main",
      createdAt: new Date(),
    };
  }

  // 2. Legacy fallback for plain UUID tokens
  try {
    const [row] = await db
      .select({
        user: users,
        expiresAt: sessions.expiresAt,
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(eq(sessions.token, token))
      .limit(1);

    if (!row) return null;
    if (row.expiresAt.getTime() < Date.now()) return null;
    return row.user;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const payload = verifyToken(token);
    const rawToken = payload?.token || token;
    try {
      await db.delete(sessions).where(eq(sessions.token, rawToken));
    } catch {
      // ignore
    }
  }
  await clearSessionCookie();
}
