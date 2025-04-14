import {packageDirectorySync} from "pkg-dir"
import * as url from "node:url"
import child_process from "node:child_process"
import fs from "node:fs"

export function notNull<T>(val: T | null | undefined, str?: string): T {
  if (val == null) {
    if (str == null) {
      throw new Error(`Assertion failed: value is null`)
    } else {
      throw new Error(`Assertion failed: value is null: ${str}`)
    }
  }
  return val
}

export function getPackageDirectory(): string {
  const __filename = url.fileURLToPath(import.meta.url)
  return notNull(packageDirectorySync({cwd: __filename}))
}

export function mapWithIndex<T, R>(
  items: Iterable<T>,
  f: (item: T, index: number) => R
): Array<R> {
  const ret: Array<R> = []
  let i = 0
  for (const item of items) {
    ret.push(f(item, i))
    i += 1
  }
  return ret
}

export async function runShellCommand({
  command,
  args,
  cwd,
  env,
  shell,
}: {
  command: string
  args: Array<string>
  cwd?: string
  env?: {[name: string]: string}
  shell?: boolean | string
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = child_process.spawn(command, args, {
      cwd,
      env,
      // Use the same stdin, stdout, stderr as this process
      stdio: "inherit",
      shell,
    })
    proc.on("exit", (code: number | null, signal: string | null) => {
      if (code === 0) {
        resolve()
      } else if (code != null) {
        reject(new Error(`Process exitted with non-zero code "${code}"`))
      } else if (signal != null) {
        reject(new Error(`Process terminated with signal "${signal}"`))
      } else {
        reject(new Error(`Process exitted with no exit code or signal`))
      }
    })
    proc.on("error", (err: Error) => {
      reject(err)
    })
  })
}

export function fileExists(path: string): boolean {
  try {
    fs.statSync(path)
    return true
  } catch (e) {
    return false
  }
}

export function fileLastModified(path: string): number {
  return fs.statSync(path).mtimeMs
}

export function dateToYYYYMMDDHHMMSS(d: Date = new Date()): string {
  const yyyy = d.getFullYear().toString().padStart(4, "0")
  const mm = (d.getMonth() + 1).toString().padStart(2, "0")
  const dd = d.getDate().toString().padStart(2, "0")
  const h = d.getHours().toString().padStart(2, "0")
  const m = d.getMinutes().toString().padStart(2, "0")
  const s = d.getSeconds().toString().padStart(2, "0")
  return `${yyyy}-${mm}-${dd}-${h}${m}${s}`
}

export function getPathToRoot(path: string): string {
  if (path.startsWith("/")) {
    path = path.substring(1)
  }
  let ret = ""
  for (const c of path) {
    if (c === "/") {
      ret += "../"
    }
  }
  return ret
}
