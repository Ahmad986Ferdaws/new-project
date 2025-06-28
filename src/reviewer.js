import fetch from "node-fetch";
import fs from "fs";
import { execSync } from "child_process";
import "dotenv/config";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function runLint() {
  try {
    execSync("npx eslint . -f json -o lint-results.json", { stdio: "inherit" });
    const lintData = JSON.parse(fs.readFileSync("lint-results.json"));
    return lintData;
  } catch (err) {
    console.error("Linting failed", err);
    return [];
  }
}

async function generateAIComments(codeSnippet, fileName) {
  const prompt = `You are an experienced senior developer. Review the following code for best practices, performance, and security. Suggest improvements:

File: ${fileName}

Code:
${codeSnippet}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  return data.choices[0].message.content;
}

async function main() {
  const lintResults = await runLint();
  for (const file of lintResults) {
    const filePath = file.filePath;
    const codeSnippet = fs.readFileSync(filePath, "utf-8").slice(0, 500);
    const aiComment = await generateAIComments(codeSnippet, filePath);
    console.log(`\nReview for ${filePath}:\n${aiComment}\n`);
  }
}

main();
