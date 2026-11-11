import type { Payload } from 'payload'
import { defaultTheme, normalizeTheme, type ThemeTokens } from '../builder/theme'

/** Token từ một doc của collection `themes` */
export function themeFromDoc(doc: unknown): ThemeTokens {
  return normalizeTheme(doc)
}

function relId(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'object') return String((value as { id: unknown }).id ?? '') || null
  return String(value)
}

/**
 * Theme hiệu lực cho một trang: ghi đè của trang -> theme trong site-settings -> mặc định.
 * Bỏ qua quyền truy cập vì trang công khai cần token.
 */
export async function loadThemeForPage(payload: Payload, pageTheme: unknown): Promise<{ tokens: ThemeTokens; themeId: string | null }> {
  const tryLoad = async (id: string | null) => {
    if (!id) return null
    const doc = await payload.findByID({ collection: 'themes', id, depth: 0, overrideAccess: true }).catch(() => null)
    return doc ? { tokens: themeFromDoc(doc), themeId: String(doc.id) } : null
  }
  const own = await tryLoad(relId(pageTheme))
  if (own) return own
  const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true }).catch(() => null)
  const site = await tryLoad(relId(settings?.theme))
  return site ?? { tokens: defaultTheme, themeId: null }
}
