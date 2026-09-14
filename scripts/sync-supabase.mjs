import pg from "pg";
const { Client } = pg;
import dotenv from "dotenv";
dotenv.config();

const DDL = `
DO $$ BEGIN
  CREATE TYPE "peer_status" AS ENUM('pending', 'accepted', 'declined');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"class_grade" text DEFAULT 'Class 11' NOT NULL,
	"exam_target" text DEFAULT 'JEE Main' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);

CREATE TABLE IF NOT EXISTS "study_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"subject" text NOT NULL,
	"topic" text NOT NULL,
	"duration_min" integer DEFAULT 25 NOT NULL,
	"focus_score" integer,
	"notes" text,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "relax_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"activity_type" text NOT NULL,
	"title" text NOT NULL,
	"duration_min" integer DEFAULT 5 NOT NULL,
	"mood_before" integer DEFAULT 3 NOT NULL,
	"mood_after" integer DEFAULT 4 NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "stress_checkins" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"stress_level" integer NOT NULL,
	"mood" text NOT NULL,
	"triggers" text[] NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "exam_infos" (
	"id" text PRIMARY KEY NOT NULL,
	"exam_name" text NOT NULL,
	"class_level" text NOT NULL,
	"subject" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"key_points" text[] NOT NULL,
	"link" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "doubts" (
	"id" text PRIMARY KEY NOT NULL,
	"author_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"subject" text NOT NULL,
	"class_grade" text DEFAULT 'Class 11' NOT NULL,
	"upvoter_ids" text[] NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "doubt_answers" (
	"id" text PRIMARY KEY NOT NULL,
	"doubt_id" text NOT NULL REFERENCES "doubts"("id") ON DELETE CASCADE,
	"author_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"body" text NOT NULL,
	"upvoter_ids" text[] NOT NULL,
	"accepted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "peers" (
	"id" text PRIMARY KEY NOT NULL,
	"requester_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"addressee_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"status" "peer_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "answers_doubt_idx" ON "doubt_answers" ("doubt_id","created_at");
CREATE INDEX IF NOT EXISTS "doubts_subject_idx" ON "doubts" ("subject","created_at");
CREATE INDEX IF NOT EXISTS "exam_name_idx" ON "exam_infos" ("exam_name","class_level");
CREATE UNIQUE INDEX IF NOT EXISTS "peers_pair_idx" ON "peers" ("requester_id","addressee_id");
CREATE INDEX IF NOT EXISTS "peers_addressee_idx" ON "peers" ("addressee_id","status");
CREATE INDEX IF NOT EXISTS "relax_user_idx" ON "relax_activities" ("user_id","completed_at");
CREATE INDEX IF NOT EXISTS "sessions_user_idx" ON "sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "checkins_user_idx" ON "stress_checkins" ("user_id","created_at");
CREATE INDEX IF NOT EXISTS "study_user_idx" ON "study_sessions" ("user_id","completed_at");
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
`;

async function main() {
  const url = process.env.DATABASE_URL;
  console.log("Connecting to database:", url.replace(/:[^:@]+@/, ":****@"));

  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL successfully!");
    console.log("Provisioning database tables...");
    await client.query(DDL);
    console.log("✅ All FocusNest tables and indexes verified/created in Supabase!");
    await client.end();
  } catch (err) {
    console.error("❌ Connection error:", err.message);
    if (err.message.includes("ENOTFOUND") || err.message.includes("ETIMEDOUT")) {
      console.log("\n👉 Tip: If this is a free Supabase project that was inactive, log into https://supabase.com/dashboard and click 'Restore project' / 'Resume'.");
    }
  }
}

main();
