import fs from 'fs'
import path from 'path'
import strip from 'strip-json-comments'
import { RequireFunction } from '.'

export function jsoncParse(data: string) {
  try {
    return new Function('return ' + strip(data).trim())()
  } catch (_) {
    // Silently ignore any error
    // That's what tsc/jsonc-parser did after all
    return {}
  }
}

const getPkgType = (): string | undefined => {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.resolve('package.json'), 'utf-8'),
    )
    return pkg.type
  } catch (error) {}
}

export function guessFormat(inputFile: string): 'esm' | 'cjs' {
  if (!usingDynamicImport) return 'cjs'

  const ext = path.extname(inputFile)
  const type = getPkgType()
  if (ext === '.js') {
    return type === 'module' ? 'esm' : 'cjs'
  } else if (ext === '.ts') {
    return 'esm'
  } else if (ext === '.mjs') {
    return 'esm'
  }
  return 'cjs'
}

declare const jest: any

// Stolen from https://github.com/vitejs/vite/blob/0713446fa4df678422c84bd141b189a930c100e7/packages/vite/src/node/utils.ts#L606
export const usingDynamicImport = typeof jest === 'undefined'
/**
 * Dynamically import files. It will make sure it's not being compiled away by TS/Rollup.
 *
 * As a temporary workaround for Jest's lack of stable ESM support, we fallback to require
 * if we're in a Jest environment.
 * See https://github.com/vitejs/vite/pull/5197#issuecomment-938054077
 *
 * @param file File path to import.
 */
export const dynamicImport: RequireFunction = (id: string, { format }) => {
  const fn =
    format === 'esm' ? new Function('file', 'return import(file)') : require
  return fn(id)
}
