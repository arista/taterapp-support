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
