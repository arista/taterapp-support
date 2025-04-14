// Manages building bundles intended to be used in a node-based
// environment (lib, cli, test, etc.)

import * as esbuild from "esbuild"

const builds = [
  {in: "src/lib.ts", out: "dist/lib/lib.es.js", format: "esm"},
  {in: "test/tests.ts", out: "build/test/tests.es.js", format: "esm"},
]

await Promise.all(
  builds.map(async (b) => {
    const context = await esbuild.context({
      entryPoints: [b.in],
      bundle: true,
      outfile: b.out,
      platform: "node",
      target: "node18",
      packages: "external",
      sourcemap: true,
      format: b.format,
      logLevel: "info",
    })
    // Do an initial build
    await context.rebuild()
    if (process.argv.includes("--watch")) {
      // Watch for code changes
      await context.watch()
    } else {
      context.dispose()
    }
  })
)
