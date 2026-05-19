// Phase 0 smoke test.
// Proves: connection works, schema migrated, Prisma Client compiles, UNIQUE
// constraints enforce. Safe to run repeatedly; cleans up after itself.

import { prisma } from "./db.js";

async function main() {
  console.log("→ Phase 0 smoke test\n");

  // 1) Read existing counts (should be 0 across the board on a fresh DB)
  const beforeCases = await prisma.case.count();
  const beforeArticles = await prisma.article.count();
  console.log(
    `  Existing rows  → cases: ${beforeCases}, articles: ${beforeArticles}`,
  );

  // 2) Insert a test Case row
  const testCase = await prisma.case.create({
    data: {
      caseSignature: "TEST|0000-W00|confirmed|smoke_test",
      country: "XX",
      caseType: "confirmed",
      currentStatus: "confirmed",
      caseCount: 1,
      dateReported: new Date("2026-05-19"),
      notes: "smoke test — safe to delete",
      locationSpecificity: "unknown",
    },
  });
  console.log(`  Inserted case  → ${testCase.id}`);

  // 3) Read it back, including a relation (should be an empty list — no articles yet)
  const refetch = await prisma.case.findUnique({
    where: { id: testCase.id },
    include: { articles: true },
  });
  if (!refetch) throw new Error("inserted case could not be read back");
  if (refetch.articles.length !== 0) throw new Error("unexpected article links");
  console.log(`  Refetched case → signature='${refetch.caseSignature}'`);

  // 4) Verify the UNIQUE constraint on caseSignature actually blocks dupes
  let dupeBlocked = false;
  try {
    await prisma.case.create({
      data: {
        caseSignature: "TEST|0000-W00|confirmed|smoke_test", // intentional dupe
        country: "XX",
        caseType: "confirmed",
        currentStatus: "confirmed",
        dateReported: new Date("2026-05-19"),
      },
    });
  } catch (e) {
    // P2002 = "Unique constraint failed on the fields: (`caseSignature`)"
    const err = e as { code?: string };
    if (err.code === "P2002") {
      dupeBlocked = true;
    } else {
      throw e;
    }
  }
  if (!dupeBlocked) {
    throw new Error(
      "UNIQUE constraint did not fire — anti-double-counting is broken",
    );
  }
  console.log("  Dedup verified → duplicate caseSignature rejected (P2002)");

  // 5) Insert an Article + link it to the test Case via the join table
  const testArticle = await prisma.article.create({
    data: {
      canonicalUrl: "https://example.test/smoke",
      title: "Smoke-test article",
      sourceName: "test",
      sourceTier: 4,
    },
  });
  await prisma.caseArticle.create({
    data: {
      caseId: testCase.id,
      articleId: testArticle.id,
      role: "primary",
    },
  });
  console.log(`  Linked article → ${testArticle.id} (role=primary)`);

  // 6) Read the link back via the join
  const withArticles = await prisma.case.findUnique({
    where: { id: testCase.id },
    include: { articles: { include: { article: true } } },
  });
  if (withArticles?.articles.length !== 1)
    throw new Error("join read-back failed");
  if (withArticles.articles[0].article.canonicalUrl !== "https://example.test/smoke")
    throw new Error("joined article fields did not round-trip");
  console.log("  Join verified  → case ↔ article round-trip OK");

  // 7) Clean up (Cascade removes the CaseArticle row automatically)
  await prisma.case.delete({ where: { id: testCase.id } });
  await prisma.article.delete({ where: { id: testArticle.id } });

  const afterCases = await prisma.case.count();
  const afterArticles = await prisma.article.count();
  if (afterCases !== beforeCases || afterArticles !== beforeArticles) {
    throw new Error(
      `row count drift! cases ${beforeCases}->${afterCases}, articles ${beforeArticles}->${afterArticles}`,
    );
  }
  console.log("  Cleanup OK     → counts back to baseline");

  console.log("\n✓ Phase 0 smoke test passed");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("\n✗ Smoke test FAILED:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
