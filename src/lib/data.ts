import type { CollectionConfig, Field, Payload } from 'payload'
import { buildWhere, collectDataNodes, type DataMap, type DataRecord, pageFromParams, projectRecord, type SourceInfo, type UrlParams } from '../builder/data'
import type { BuilderNode } from '../builder/types'

/**
 * Cấu hình "nguồn dữ liệu" của một collection, khai báo trong `custom.builder` của CollectionConfig:
 *   custom: { builder: { label: 'Thành viên', expose: ['name', 'title', 'avatar'] } }
 * `expose` = các trường được phép đưa ra trang công khai (không bao giờ lộ email, mật khẩu…).
 * Thêm collection mới cho web khác chỉ cần thêm khai báo này.
 */
export interface BuilderSourceConfig {
  label?: string
  expose: string[]
  /** Độ sâu populate quan hệ/upload (mặc định 1) */
  depth?: number
}

function sourceConfig(config: CollectionConfig): BuilderSourceConfig | null {
  const c = (config.custom as { builder?: BuilderSourceConfig } | undefined)?.builder
  return c && Array.isArray(c.expose) && c.expose.length ? c : null
}

function fieldInfo(field: Field, expose: string[] | null): SourceInfo['fields'][number] | null {
  if (!('name' in field) || !field.name) return null
  if (expose && !expose.includes(field.name)) return null
  const label = typeof field.label === 'string' ? field.label : field.name
  if (field.type === 'group' && 'fields' in field)
    return { name: field.name, label, type: 'group', fields: field.fields.map((f) => fieldInfo(f, null)).filter((f): f is NonNullable<typeof f> => !!f) }
  return { name: field.name, label, type: field.type }
}

/** Danh sách nguồn dữ liệu và trường công khai – cho bộ chọn ⚡ trong editor */
export function getSources(payload: Payload): SourceInfo[] {
  const out: SourceInfo[] = []
  for (const col of payload.config.collections) {
    const cfg = sourceConfig(col)
    if (!cfg) continue
    const fields = col.fields.map((f) => fieldInfo(f, cfg.expose)).filter((f): f is NonNullable<typeof f> => !!f)
    out.push({ slug: col.slug, label: cfg.label ?? (typeof col.labels?.plural === 'string' ? col.labels.plural : col.slug), fields: [{ name: 'id', label: 'ID', type: 'text' }, ...fields] })
  }
  return out
}

/** Nạp dữ liệu cho mọi node có nguồn trong cây (gọi sau resolveRefs). Chỉ trả về trường được expose. */
export async function loadDataForTree(payload: Payload, root: BuilderNode, params: UrlParams = {}): Promise<DataMap> {
  const nodes = collectDataNodes(root)
  const map: DataMap = {}
  const configs = new Map<string, BuilderSourceConfig | null>(payload.config.collections.map((c) => [c.slug as string, sourceConfig(c)]))
  await Promise.all(
    nodes.map(async ({ id, source }) => {
      const cfg = configs.get(source.collection)
      if (!cfg) return
      try {
        const find = payload.find as unknown as (args: Record<string, unknown>) => Promise<{ docs: Record<string, unknown>[]; totalDocs: number; page?: number; totalPages?: number }>
        const limit = source.mode === 'one' ? 1 : (source.limit ?? 12)
        const page = source.urlParams ? pageFromParams(params) : 1
        const res = await find({
          collection: source.collection,
          where: buildWhere(source, source.urlParams ? params : undefined, cfg.expose),
          sort: source.sort,
          limit,
          page,
          depth: cfg.depth ?? 1,
          overrideAccess: true,
        })
        map[id] = { records: res.docs.map((d) => projectRecord(d, cfg.expose)), total: res.totalDocs, page: res.page ?? page, totalPages: Math.max(1, res.totalPages ?? 1), limit }
      } catch (err) {
        payload.logger.warn({ err, collection: source.collection }, 'Không nạp được nguồn dữ liệu cho builder')
        map[id] = { records: [], total: 0, page: 1, totalPages: 1, limit: 1 }
      }
    }),
  )
  return map
}

export type { DataRecord }
