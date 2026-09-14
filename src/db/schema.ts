import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ---------------------------------- users --------------------------------- */

export const users = pgTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    classGrade: text("class_grade").notNull().default("Class 11"),
    examTarget: text("exam_target").notNull().default("JEE Main"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("users_email_idx").on(t.email)]
);

/* -------------------------------- sessions -------------------------------- */

export const sessions = pgTable(
  "sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    token: text("token").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)]
);

/* ------------------------------ study sessions ----------------------------- */

export const studySessions = pgTable(
  "study_sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subject: text("subject").notNull(),
    topic: text("topic").notNull(),
    durationMin: integer("duration_min").notNull().default(25),
    focusScore: integer("focus_score"),
    notes: text("notes"),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("study_user_idx").on(t.userId, t.completedAt)]
);

/* ------------------------------ relax activities ---------------------------- */

export const relaxActivities = pgTable(
  "relax_activities",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    activityType: text("activity_type").notNull(), // breathing | stretch | walk | screen-break | music
    title: text("title").notNull(),
    durationMin: integer("duration_min").notNull().default(5),
    moodBefore: integer("mood_before").notNull().default(3),
    moodAfter: integer("mood_after").notNull().default(4),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("relax_user_idx").on(t.userId, t.completedAt)]
);

/* ------------------------------ stress check-ins ---------------------------- */

export const stressCheckins = pgTable(
  "stress_checkins",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stressLevel: integer("stress_level").notNull(), // 1-10
    mood: text("mood").notNull(), // calm | okay | anxious | overwhelmed
    triggers: text("triggers").array().notNull().$defaultFn(() => []),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("checkins_user_idx").on(t.userId, t.createdAt)]
);

/* ---------------------------------- peers ---------------------------------- */

export const peerStatus = pgEnum("peer_status", [
  "pending",
  "accepted",
  "declined",
]);

export const peers = pgTable(
  "peers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    requesterId: text("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    addresseeId: text("addressee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: peerStatus("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("peers_pair_idx").on(t.requesterId, t.addresseeId),
    index("peers_addressee_idx").on(t.addresseeId, t.status),
  ]
);

/* ---------------------------------- doubts --------------------------------- */

export const doubts = pgTable(
  "doubts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    subject: text("subject").notNull(),
    classGrade: text("class_grade").notNull().default("Class 11"),
    upvoterIds: text("upvoter_ids").array().notNull().$defaultFn(() => []),
    resolved: boolean("resolved").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("doubts_subject_idx").on(t.subject, t.createdAt)]
);

export const doubtAnswers = pgTable(
  "doubt_answers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    doubtId: text("doubt_id")
      .notNull()
      .references(() => doubts.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    upvoterIds: text("upvoter_ids").array().notNull().$defaultFn(() => []),
    accepted: boolean("accepted").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("answers_doubt_idx").on(t.doubtId, t.createdAt)]
);

/* -------------------------------- exam intel ------------------------------- */

export const examInfos = pgTable(
  "exam_infos",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    examName: text("exam_name").notNull(), // JEE Main, JEE Advanced, NEET, BITSAT, CUET, Olympiad
    classLevel: text("class_level").notNull(), // Class 8..12
    subject: text("subject").notNull(), // Physics | Chemistry | Maths | Biology | General
    title: text("title").notNull(),
    body: text("body").notNull(),
    keyPoints: text("key_points").array().notNull().$defaultFn(() => []),
    link: text("link"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("exam_name_idx").on(t.examName, t.classLevel)]
);

/* ------------------------------- type exports ------------------------------- */

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type StudySession = typeof studySessions.$inferSelect;
export type RelaxActivity = typeof relaxActivities.$inferSelect;
export type StressCheckin = typeof stressCheckins.$inferSelect;
export type Peer = typeof peers.$inferSelect;
export type Doubt = typeof doubts.$inferSelect;
export type DoubtAnswer = typeof doubtAnswers.$inferSelect;
export type ExamInfo = typeof examInfos.$inferSelect;
