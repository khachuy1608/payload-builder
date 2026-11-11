import config from '@payload-config'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import { pageLayoutFrom, sitePartsFrom } from '@/builder/siteParts'
import { roleOf } from '@/lib/access'
import { normalizeContent } from '@/builder/validate'
import { Editor } from '@/editor/Editor'

export const dynamic = 'force-dynamic'

type Args = { params: Promise<{ id: string }> }

export default async function BuilderPage({ params }: Args) {
  const { id } = await params
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect(`/admin/login?redirect=${encodeURIComponent(`/builder/${id}`)}`)

  const page = await payload
    .findByID({ collection: 'pages', id, draft: true, depth: 1, user, overrideAccess: false })
    .catch(() => null)
  if (!page) notFound()
  const settings = (await payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true }).catch(() => null)) as Record<string, unknown> | null

  return (
    <Editor
      initial={{
        kind: 'page',
        userId: String(user.id),
        role: roleOf(user),
        readOnly: roleOf(user) === 'viewer',
        pageThemeId: page.theme == null ? null : String(typeof page.theme === 'object' ? page.theme.id : page.theme),
        template: page.templateCollection ? { collection: String(page.templateCollection), field: String(page.templateField || 'id') } : null,
        siteParts: sitePartsFrom(settings),
        layout: pageLayoutFrom(page as unknown as Record<string, unknown>),
        seo: {
          metaTitle: page.seo?.metaTitle ?? '',
          metaDescription: page.seo?.metaDescription ?? '',
          ogImage: page.seo?.ogImage && typeof page.seo.ogImage === 'object' ? { id: page.seo.ogImage.id, url: page.seo.ogImage.url ?? '', alt: page.seo.ogImage.alt ?? '' } : null,
          noIndex: !!page.seo?.noIndex,
          canonical: page.seo?.canonical ?? '',
        },
        id: String(page.id),
        title: page.title,
        slug: page.slug,
        status: page._status === 'published' ? 'published' : 'draft',
        content: normalizeContent(page.content),
      }}
    />
  )
}
