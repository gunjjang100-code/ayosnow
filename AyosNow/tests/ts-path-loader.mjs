import { existsSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

function resolveExistingTypeScriptFile(sourcePath) {
  const candidates = [`${sourcePath}.ts`, `${sourcePath}.tsx`, resolvePath(sourcePath, "index.ts")];
  return candidates.find((candidate) => existsSync(candidate));
}

export async function resolve(specifier, context, defaultResolve) {
  if (specifier === "server-only") {
    return {
      url: "data:text/javascript,export {};",
      shortCircuit: true,
    };
  }

  if (specifier.startsWith("@/")) {
    const sourcePath = resolvePath(process.cwd(), "src", specifier.slice(2));
    const matched = resolveExistingTypeScriptFile(sourcePath);

    if (matched) {
      return defaultResolve(pathToFileURL(matched).href, context, defaultResolve);
    }
  }

  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    context.parentURL?.startsWith("file:")
  ) {
    const sourcePath = resolvePath(dirname(fileURLToPath(context.parentURL)), specifier);
    const matched = resolveExistingTypeScriptFile(sourcePath);

    if (matched) {
      return defaultResolve(pathToFileURL(matched).href, context, defaultResolve);
    }
  }

  return defaultResolve(specifier, context, defaultResolve);
}
