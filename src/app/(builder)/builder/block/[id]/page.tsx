import config from '@payload-config'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import { Editor } from '@/editor/Editor'
import { normalizeBlockTree } from '@/lib/blocks'

export const dynamic = 'force-dynamic'

type Args = { params: Promise<{ id: string }> }

/** Sửa BẢN GỐC của một My Block bằng chính Visual Builder: canvas là root chứa đúng một phần tử (cây của block) */
export default async function BlockBuilderPage({ params }: Args) {
  const { id } = await params
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect(`/admin/login?redirect=${encodeURIComponent(`/builder/block/${id}`)}`)

  const block = await payload.findByID({ collection: 'my-blocks', id, depth: 0, user, overrideAccess: false }).catch(() => null)
  if (!block) notFound()

  const tree = normalizeBlockTree(block.tree)
  const owner = block.owner == null ? null : String(typeof block.owner === 'object' ? block.owner.id : block.owner)

  return (
    <Editor
      initial={{
        kind: 'block',
        id: String(block.id),
        title: block.name,
        slug: '',
        status: 'published',
        scope: block.scope === 'shared' ? 'shared' : 'private',
        readOnly: owner !== null && owner !== String(user.id),
        userId: String(user.id),
        content: { version: 1, root: { id: 'root', type: 'root', props: {}, styles: {}, children: tree ? [tree] : [] } },
      }}
    />
  )
}
