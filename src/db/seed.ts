/**
 * Seed script — run with: npx tsx src/db/seed.ts
 * Idempotent: skips everything when users already exist.
 */
import "dotenv/config";
import { sql } from "drizzle-orm";
import { db, ensureDbReady } from "./index";
import {
  doubtAnswers,
  doubts,
  examInfos,
  peers,
  relaxActivities,
  stressCheckins,
  studySessions,
  users,
} from "./schema";
import { hashPassword } from "../lib/auth";

const day = (n: number, hour = 10, min = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, min, 0, 0);
  return d;
};

async function main() {
  await ensureDbReady();
  const [existing] = await db.select({ n: sql<number>`count(*)::int` }).from(users);
  if (existing.n > 0) {
    console.log(`Seed skipped — ${existing.n} users already present.`);
    return;
  }

  const password = await hashPassword("demo1234");

  const seedUsers = [
    { id: "u_shanmukha", name: "Shanmukha Krishna", email: "shanmukhakrishna2009@gmail.com", classGrade: "Class 11", examTarget: "JEE Main", password: "password123" },
    { id: "u_demo", name: "Aarav Sharma", email: "demo@focusnest.app", classGrade: "Class 11", examTarget: "JEE Advanced", password: "demo1234" },
    { id: "u_riya", name: "Riya Patel", email: "riya@focusnest.app", classGrade: "Class 11", examTarget: "JEE Main", password: "demo1234" },
    { id: "u_kabir", name: "Kabir Mehta", email: "kabir@focusnest.app", classGrade: "Class 12", examTarget: "NEET", password: "demo1234" },
    { id: "u_ananya", name: "Ananya Iyer", email: "ananya@focusnest.app", classGrade: "Class 12", examTarget: "JEE Advanced", password: "demo1234" },
    { id: "u_ved", name: "Ved Kulkarni", email: "ved@focusnest.app", classGrade: "Class 10", examTarget: "Olympiads", password: "demo1234" },
    { id: "u_isha", name: "Isha Verma", email: "isha@focusnest.app", classGrade: "Class 11", examTarget: "BITSAT", password: "demo1234" },
    { id: "u_rohan", name: "Rohan Das", email: "rohan@focusnest.app", classGrade: "Class 12", examTarget: "CUET", password: "demo1234" },
    { id: "u_meera", name: "Meera Nair", email: "meera@focusnest.app", classGrade: "Class 9", examTarget: "NTSE", password: "demo1234" },
  ];

  const userInserts = [];
  for (const u of seedUsers) {
    const hash = await hashPassword(u.password);
    userInserts.push({
      id: u.id,
      name: u.name,
      email: u.email,
      passwordHash: hash,
      classGrade: u.classGrade,
      examTarget: u.examTarget,
    });
  }

  await db.insert(users).values(userInserts);
  console.log(`Seeded ${seedUsers.length} users (demo@focusnest.app / demo1234).`);

  /* ----------------------------- exam intel ----------------------------- */

  const examData: Array<typeof examInfos.$inferInsert> = [
    {
      id: "e1", examName: "JEE Main", classLevel: "Class 11", subject: "Physics",
      title: "Kinematics & Laws of Motion — JEE Main weightage",
      body: "Kinematics and Newton's Laws form the backbone of mechanics in JEE Main. Roughly 6–8 marks appear every year, mostly as numeric-value questions. Build a strong grip on relative motion, projectile motion on inclined planes, and constraint relations before moving to rotation.",
      keyPoints: [
        "Expect 2–3 questions from kinematics + NLM combined",
        "Graph-based questions (v-t, s-t) are almost guaranteed",
        "Practice river-boat and rain-man problems for relative velocity",
        "NLM: focus on pseudo forces, friction with variable normal, spring systems",
      ],
      link: "https://jeemain.nta.nic.in",
    },
    {
      id: "e2", examName: "JEE Main", classLevel: "Class 12", subject: "Chemistry",
      title: "Organic Chemistry reaction map you must memorize",
      body: "Organic chemistry contributes ~30% of JEE Main chemistry. The single highest-yield strategy is a reaction roadmap: name reactions (Aldol, Cannizzaro, Hoffmann, Sandmeyer), GOC effects, and named tests. One question on named reactions appears in almost every paper.",
      keyPoints: [
        "Name reactions: Aldol, Cannizzaro, Hoffmann bromamide, Sandmeyer, Wurtz",
        "Aromatic electrophilic substitution — activators vs deactivators",
        "Stability of intermediates: carbocation > free radical > carbanion reasoning",
        "Acidic/basic strength comparison via resonance and inductive effects",
      ],
      link: "https://jeemain.nta.nic.in",
    },
    {
      id: "e3", examName: "JEE Advanced", classLevel: "Class 12", subject: "Physics",
      title: "Electrostatics — multi-concept problems decoded",
      body: "JEE Advanced loves clubbing electrostatics with work-energy and SHM. Expected question types: dipole in a non-uniform field, dielectric slab partially inserted in a capacitor, and charge distribution via field lines. Past 5 years show at least one multi-correct question from this chapter.",
      keyPoints: [
        "Dielectric insertion changes in force/energy stored — derive, don't memorize",
        "Method of images and equipotential reasoning appear in single-correct",
        "Practice force on a dielectric slab pulled into a charged capacitor",
        "Gauss law with asymmetry traps: use superposition",
      ],
      link: "https://jeeadv.ac.in",
    },
    {
      id: "e4", examName: "NEET", classLevel: "Class 12", subject: "Biology",
      title: "Human Physiology: the highest-weightage NEET unit",
      body: "Human physiology alone carries 40+ marks in NEET biology. NCERT lines are the primary source — most questions are direct or slightly paraphrased statements. Prioritise digestion, circulation, and excretion first, then neural and chemical coordination.",
      keyPoints: [
        "Read NCERT biology 5 times before touching reference books",
        "Enzyme sites of action in the digestive system — a repeated NEET favourite",
        "Cardiac cycle durations, ECG waves, and blood pressure values are often asked",
        "Differences between cortical vs juxtamedullary nephrons",
      ],
      link: "https://neet.nta.nic.in",
    },
    {
      id: "e5", examName: "NEET", classLevel: "Class 11", subject: "Chemistry",
      title: "Mole concept & stoichiometry starter kit",
      body: "For Class 11 students starting NEET prep, mole concept is the gateway chapter. NEET asks 3–4 direct numericals from molarity, molality, limiting reagent, and empirical formula. Master unit conversions first — most silly mistakes are unit errors.",
      keyPoints: [
        "Limiting reagent identification appears nearly every year",
        "Know molarity vs molality interconversion with density",
        "Empirical vs molecular formula from combustion data",
        "Practice 20 numericals a week from day one",
      ],
      link: "https://neet.nta.nic.in",
    },
    {
      id: "e6", examName: "BITSAT", classLevel: "Class 11", subject: "Maths",
      title: "BITSAT Maths speed tactics",
      body: "BITSAT is a speed exam — 130 questions in 180 minutes with no marks deducted for guessing in bonus questions. Maths dominates the difficulty. Learn short-cut elimination: plug-in answer choices, parity checks, and symmetric options are your friends.",
      keyPoints: [
        "~45 maths questions; aim for 40+ correct",
        "Complex numbers and conics are the most scoring sections",
        "Attempt every question — negative marking only on some sections",
        "Mock with a 45-second-per-question budget from month one",
      ],
      link: "https://www.bitsadmission.com",
    },
    {
      id: "e7", examName: "CUET", classLevel: "Class 12", subject: "General",
      title: "CUET 2025 pattern & how to prepare with boards",
      body: "CUET UG is your gateway to central universities. The syllabus overlaps almost fully with Class 12 boards — studying for boards IS studying for CUET. Section IA language carries 50 questions and is often the score booster students ignore.",
      keyPoints: [
        "Domain subjects are NCERT-first; language sections decide ranks",
        "General Test: reasoning, GK, and current affairs of the last 12 months",
        "No negative marking in the optional general test questions",
        "Take the exam in your board's medium to avoid score normalization issues",
      ],
      link: "https://cuet.nta.nic.in",
    },
    {
      id: "e8", examName: "Olympiad", classLevel: "Class 10", subject: "Maths",
      title: "PRMO & IOQM: first steps for Class 10",
      body: "PRMO (now IOQM) is the entry to the maths olympiad pipeline. Class 9–10 is the ideal time to begin. The paper tests thinking, not formulas — geometry, number theory, and combinatorics dominate. Start with problem-solving books, not syllabus books.",
      keyPoints: [
        "Number theory and combinatorics contribute ~40% of IOQM",
        "Solve previous IOQM papers timed, then analyse every miss",
        "Geometry: practice angle chasing and cyclic quadrilaterals",
        "Daily 2 problem minimum beats weekly marathon sessions",
      ],
      link: "https://www.mtai.org.in",
    },
    {
      id: "e9", examName: "Olympiad", classLevel: "Class 9", subject: "Physics",
      title: "NSEJS: junior science olympiad roadmap",
      body: "NSEJS (National Standard Examination in Junior Science) covers physics, chemistry, biology, and maths for Classes 8–10. It rewards conceptual depth over rote formulas. Experiments you can do at home — springs, mirrors, batteries — map directly to questions.",
      keyPoints: [
        "Mixed-science paper: physics ~30%, rest spread across chem/bio/maths",
        "HC Verma's concepts (volume 1, chapters 1–10) is a good physics base",
        "Diagram-based biology questions come straight from NCERT",
        "Cutoffs are lower than you think — attempt with confidence",
      ],
      link: "https://www.iapt.org.in",
    },
    {
      id: "e10", examName: "NTSE", classLevel: "Class 9", subject: "General",
      title: "NTSE Stage 1: MAT + SAT strategy for Class 9",
      body: "NTSE scholarship exam tests MAT (mental ability) and SAT (scholastic aptitude). MAT is a pattern-solving game: series, analogies, coding-decoding, and cube-dice. Practising 30 MAT questions daily for 3 months is usually enough to crack stage 1.",
      keyPoints: [
        "MAT: master series completion, analogies, and embedded figures first",
        "SAT: state-board syllabus; NCERT Class 9–10 is the core",
        "Negative marking in SAT — do not blind-guess",
        "Keep a mistake notebook for pattern traps",
      ],
      link: "https://ncert.nic.in",
    },
    {
      id: "e11", examName: "JEE Advanced", classLevel: "Class 11", subject: "Maths",
      title: "Coordinate Geometry for JEE Advanced: conic masterclass",
      body: "Conic sections are the most formula-dense JEE Advanced maths topic but also the most predictable. Parabola + ellipse questions appear in multi-correct form. Always parameterize points — it halves your algebra in almost every problem.",
      keyPoints: [
        "Parameter forms of parabola/ellipse save 10+ minutes per paper",
        "Chord of contact and pair of tangents are repeated 3-yearly patterns",
        "Focus-directrix property solves location-of-point questions instantly",
        "Practice conics mixed with tangency conditions (circle + conic) together",
      ],
      link: "https://jeeadv.ac.in",
    },
    {
      id: "e12", examName: "JEE Main", classLevel: "Class 10", subject: "Maths",
      title: "Class 10 → JEE foundation: the 80/20 checklist",
      body: "Class 10 is a foundation year, not a free year. JEE toppers finish algebra basics (quadratics, polynomials, trigonometry up to identities) before Class 11 begins. The chapters that matter most later: linear equations, polynomials, and basic trigonometry.",
      keyPoints: [
        "Master quadratic equations beyond NCERT — discriminants, Vieta's relations",
        "Trigonometry: ratios, identities, and heights & distances to fluency",
        "Geometry circles + triangles is the olympiad bridge",
        "Start 20-minute daily maths practice in January itself",
      ],
      link: "https://jeemain.nta.nic.in",
    },
  ];

  await db.insert(examInfos).values(examData);
  console.log(`Seeded ${examData.length} exam info cards.`);

  /* -------------------------------- doubts -------------------------------- */

  await db.insert(doubts).values([
    {
      id: "d1",
      authorId: "u_riya",
      title: "Why is work done by friction negative on a block sliding down an incline?",
      body: "In HC Verma's example, the friction force acts opposite to displacement so work is negative. But then the block speeds up anyway? Where does the energy go and why isn't kinetic energy simply mgh?",
      subject: "Physics",
      classGrade: "Class 11",
      upvoterIds: ["u_demo", "u_kabir", "u_ananya"],
      resolved: true,
      createdAt: day(2, 18, 20),
    },
    {
      id: "d2",
      authorId: "u_demo",
      title: "How to identify if a quadratic has real roots without solving it?",
      body: "I keep solving quadratics fully in JEE mocks and wasting time. Is checking the discriminant enough for 'roots are real' questions, or are there edge cases with complex coefficients?",
      subject: "Maths",
      classGrade: "Class 11",
      upvoterIds: ["u_riya", "u_isha"],
      resolved: true,
      createdAt: day(3, 21, 5),
    },
    {
      id: "d3",
      authorId: "u_kabir",
      title: "SN1 vs SN2: how do I decide from a reaction alone?",
      body: "NEET repeatedly asks which mechanism a reaction follows. I know SN2 needs a good leaving group and primary carbon, but what about polar aprotic vs protic solvents — how do they actually change the outcome?",
      subject: "Chemistry",
      classGrade: "Class 12",
      upvoterIds: ["u_demo"],
      resolved: false,
      createdAt: day(1, 20, 45),
    },
    {
      id: "d4",
      authorId: "u_ananya",
      title: "Capacitor with partially inserted dielectric — force direction?",
      body: "When a dielectric slab is pulled out of a charged capacitor, I get conflicting answers from energy vs force methods. Which is correct for JEE Advanced and why do they differ?",
      subject: "Physics",
      classGrade: "Class 12",
      upvoterIds: [],
      resolved: false,
      createdAt: day(0, 9, 30),
    },
    {
      id: "d5",
      authorId: "u_isha",
      title: "Best order to revise Class 11 organic before Class 12 finals?",
      body: "I have 6 weeks. Should I do GOC first or go straight to named reactions? My basics are weak and I want maximum marks in BITSAT chemistry.",
      subject: "Chemistry",
      classGrade: "Class 11",
      upvoterIds: ["u_demo", "u_riya"],
      resolved: false,
      createdAt: day(0, 12, 10),
    },
    {
      id: "d6",
      authorId: "u_ved",
      title: "Cyclic quadrilaterals in IOQM — where do I start?",
      body: "Every geometry problem I attempt seems to need cyclic quadrilateral properties. What's a good order to learn: angle chasing first, or power of a point first?",
      subject: "Maths",
      classGrade: "Class 10",
      upvoterIds: ["u_demo"],
      resolved: false,
      createdAt: day(1, 17, 0),
    },
  ]);

  await db.insert(doubtAnswers).values([
    {
      id: "a1",
      doubtId: "d1",
      authorId: "u_demo",
      body: "Great question! Friction does negative work on the block (−fd) — that energy becomes heat. The block still speeds up because gravity does MORE positive work (mgh). So KE gained = mgh − fd, which is the work-energy theorem: net work = ΔKE. If friction were doing positive work, the block would speed up more than free fall, which would violate energy conservation.",
      upvoterIds: ["u_riya", "u_kabir"],
      accepted: true,
      createdAt: day(2, 19, 0),
    },
    {
      id: "a2",
      doubtId: "d1",
      authorId: "u_ananya",
      body: "To add — you can also see it from power: P = f·v. Friction's force vector is always opposite to velocity, so the dot product is negative, so power is negative, so it always drains energy. Gravity's component along the slope can be positive or negative depending on motion direction.",
      upvoterIds: ["u_demo"],
      accepted: false,
      createdAt: day(2, 19, 30),
    },
    {
      id: "a3",
      doubtId: "d2",
      authorId: "u_riya",
      body: "Yes! For ax² + bx + c with real coefficients, discriminant D = b² − 4ac ≥ 0 ⇔ real roots. No edge cases for real coefficients. For complex coefficients the discriminant test does NOT apply — but JEE Main almost never asks that. Time-saver: if a and c have opposite signs, roots are always real (because b² − 4ac > 0 automatically). That trick kills many MCQ options instantly.",
      upvoterIds: ["u_demo", "u_isha"],
      accepted: true,
      createdAt: day(3, 21, 40),
    },
    {
      id: "a4",
      doubtId: "d3",
      authorId: "u_ananya",
      body: "Decision tree: 1) Primary carbon → SN2 (unless crowded base). 2) Tertiary carbon → SN1. 3) Secondary → look at solvent: polar protic (water, alcohols) stabilises the carbocation → SN1; polar aprotic (acetone, DMSO) → SN2. Remember: protic solvents H-bond and cage the nucleophile, slowing SN2; aprotic solvents leave it naked and fast.",
      upvoterIds: ["u_demo"],
      accepted: false,
      createdAt: day(1, 21, 15),
    },
    {
      id: "a5",
      doubtId: "d6",
      authorId: "u_demo",
      body: "Start with angle chasing (Evan Chen's 'Euclidean Geometry in Mathematical Olympiads' first 2 chapters). Power of a point comes after you can see cyclic quads automatically: look for equal angles, perpendicular bisectors, and arcs. Then practice IOQM 2019–2023 geometry questions — they're 70% cyclic quads.",
      upvoterIds: ["u_ved"],
      accepted: false,
      createdAt: day(1, 18, 20),
    },
  ]);

  console.log("Seeded 6 doubts and 5 answers.");

  /* ---------------------------- study sessions ---------------------------- */

  const studyRows: Array<typeof studySessions.$inferInsert> = [
    { id: "s1", userId: "u_demo", subject: "Physics", topic: "Rotational Motion — angular momentum", durationMin: 50, focusScore: 4, notes: "Solved 12 problems, stuck on rolling + slipping combo.", completedAt: day(0, 7, 30) },
    { id: "s2", userId: "u_demo", subject: "Maths", topic: "Quadratic equations mixed drill", durationMin: 25, focusScore: 5, notes: "Full focus, finished 30 MCQs.", completedAt: day(0, 11, 0) },
    { id: "s3", userId: "u_demo", subject: "Chemistry", topic: "GOC — resonance and hyperconjugation", durationMin: 45, focusScore: 3, notes: "Phone distraction around 20 min.", completedAt: day(1, 9, 0) },
    { id: "s4", userId: "u_demo", subject: "Physics", topic: "Gravitation — orbital mechanics", durationMin: 50, focusScore: 4, notes: null, completedAt: day(1, 16, 0) },
    { id: "s5", userId: "u_demo", subject: "Maths", topic: "Limits & continuity basics", durationMin: 30, focusScore: 3, notes: null, completedAt: day(2, 10, 15) },
    { id: "s6", userId: "u_demo", subject: "Chemistry", topic: "Mole concept numericals", durationMin: 40, focusScore: 4, notes: "Feels solid now.", completedAt: day(3, 8, 0) },
    { id: "s7", userId: "u_demo", subject: "Physics", topic: "Kinematics graphs practice", durationMin: 25, focusScore: 4, notes: null, completedAt: day(4, 14, 0) },
    { id: "s8", userId: "u_demo", subject: "Maths", topic: "Trig identities — 40 problems", durationMin: 60, focusScore: 5, notes: "Deep work, no breaks needed.", completedAt: day(5, 9, 30) },
    { id: "s9", userId: "u_demo", subject: "Physics", topic: "Newton's laws — inclined planes", durationMin: 35, focusScore: 3, notes: null, completedAt: day(6, 18, 0) },
  ];
  await db.insert(studySessions).values(studyRows);
  console.log(`Seeded ${studyRows.length} study sessions.`);

  /* --------------------------- relax activities --------------------------- */

  await db.insert(relaxActivities).values([
    { id: "r1", userId: "u_demo", activityType: "breathing", title: "Box Breathing", durationMin: 5, moodBefore: 2, moodAfter: 4, completedAt: day(0, 12, 45) },
    { id: "r2", userId: "u_demo", activityType: "stretch", title: "Neck & Shoulder Stretch", durationMin: 8, moodBefore: 3, moodAfter: 5, completedAt: day(1, 15, 30) },
    { id: "r3", userId: "u_demo", activityType: "walk", title: "Evening Walk", durationMin: 20, moodBefore: 2, moodAfter: 4, completedAt: day(2, 18, 0) },
    { id: "r4", userId: "u_demo", activityType: "music", title: "Lo-fi Music Break", durationMin: 10, moodBefore: 3, moodAfter: 4, completedAt: day(3, 13, 0) },
    { id: "r5", userId: "u_demo", activityType: "screen-break", title: "Digital Sunset — no screens", durationMin: 15, moodBefore: 2, moodAfter: 4, completedAt: day(4, 19, 30) },
  ]);
  console.log("Seeded 5 relaxation activities.");

  /* ----------------------------- stress check-ins ---------------------------- */

  await db.insert(stressCheckins).values([
    { id: "c1", userId: "u_demo", stressLevel: 7, mood: "anxious", triggers: ["mock test tomorrow", "chemistry backlog"], note: "GOC still feels shaky. Did a breathing session and calmed down.", createdAt: day(0, 8, 0) },
    { id: "c2", userId: "u_demo", stressLevel: 4, mood: "calm", triggers: [], note: "Good study pod with Riya. Rotational momentum finally clicked.", createdAt: day(0, 19, 0) },
    { id: "c3", userId: "u_demo", stressLevel: 6, mood: "okay", triggers: ["comparing with classmates"], note: "Someone finished the module faster. Reminding myself it's my own race.", createdAt: day(1, 9, 30) },
    { id: "c4", userId: "u_demo", stressLevel: 3, mood: "calm", triggers: [], note: "Solid day. 2 pods, 1 walk, felt balanced.", createdAt: day(2, 20, 0) },
    { id: "c5", userId: "u_demo", stressLevel: 8, mood: "overwhelmed", triggers: ["syllabus anxiety", "parents' expectations"], note: "Talked to Kabir — he reminded me everyone feels this in Class 11. Felt less alone.", createdAt: day(4, 21, 0) },
    { id: "c6", userId: "u_demo", stressLevel: 5, mood: "okay", triggers: ["phone addiction"], note: "Deleted short-video apps. First day without them.", createdAt: day(6, 18, 30) },
  ]);
  console.log("Seeded 6 stress check-ins.");

  /* --------------------------------- peers --------------------------------- */

  await db.insert(peers).values([
    { id: "p1", requesterId: "u_riya", addresseeId: "u_demo", status: "accepted", createdAt: day(10, 12, 0), updatedAt: day(10, 12, 0) },
    { id: "p2", requesterId: "u_kabir", addresseeId: "u_demo", status: "accepted", createdAt: day(8, 18, 0), updatedAt: day(8, 18, 0) },
    { id: "p3", requesterId: "u_demo", addresseeId: "u_ananya", status: "accepted", createdAt: day(6, 11, 0), updatedAt: day(6, 11, 0) },
    { id: "p4", requesterId: "u_isha", addresseeId: "u_demo", status: "pending", createdAt: day(1, 16, 0), updatedAt: day(1, 16, 0) },
    { id: "p5", requesterId: "u_demo", addresseeId: "u_ved", status: "pending", createdAt: day(0, 10, 0), updatedAt: day(0, 10, 0) },
    { id: "p6", requesterId: "u_ananya", addresseeId: "u_riya", status: "accepted", createdAt: day(5, 9, 0), updatedAt: day(5, 9, 0) },
  ]);
  console.log("Seeded 6 peer relationships.");
}

main()
  .then(() => {
    console.log("✅ Seed complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
