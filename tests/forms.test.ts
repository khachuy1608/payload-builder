import assert from 'node:assert/strict'
import { test } from 'node:test'
import { submissionsToCsv } from '../src/lib/formExport'

test('submissionsToCsv: cột cố định + hợp khoá data, trích dẫn giá trị đặc biệt, BOM', () => {
  const csv = submissionsToCsv([
    { id: 1, form: 'lien-he', page: '/lien-he', createdAt: '2026-01-01T00:00:00.000Z', data: { 'ho-ten': 'A, B', email: 'a@b.c' } },
    { id: 2, form: 'lien-he', page: '/', createdAt: '2026-01-02T00:00:00.000Z', data: { email: 'x"y', tags: ['1', '2'], 'loi-nhan': 'dòng 1\nd2' } },
  ])
  const lines = csv.split('\r\n')
  assert.ok(lines[0].startsWith('﻿'))
  assert.equal(lines[0].replace('﻿', ''), 'id,form,page,createdAt,ho-ten,email,tags,loi-nhan')
  assert.equal(lines[1], '1,lien-he,/lien-he,2026-01-01T00:00:00.000Z,"A, B",a@b.c,,')
  assert.equal(lines[2], '2,lien-he,/,2026-01-02T00:00:00.000Z,,"x""y",1; 2,"dòng 1\nd2"')
})
