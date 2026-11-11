import config from '@payload-config'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
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
    .findByID({ collection: 'pages', id, draft: true, depth: 0, user, overrideAccess: false })
    .catch(() => null)
  if (!page) notFound()

  return (
    <Editor
      initial={{
        id: String(page.id),
        title: page.title,
        slug: page.slug,
        status: page._status === 'published' ? 'published' : 'draft',
        content: normalizeContent(page.content),
      }}
    />
  )
}
