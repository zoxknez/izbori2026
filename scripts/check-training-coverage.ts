import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { rules } = await import("../src/content/rules");
  const { buildTrainingQuestions } = await import("../src/lib/domain/training/generate-questions");
  const { assertTrainingCoverage } = await import("../src/lib/domain/training/coverage");

  const questions = buildTrainingQuestions(rules);
  assertTrainingCoverage(rules, questions);
  console.log(`Training coverage OK: ${questions.length} pitanja za ${rules.length} pravila.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
