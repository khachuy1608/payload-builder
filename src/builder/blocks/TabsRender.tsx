'use client'

import { Children, useState } from 'react'
import type { RenderProps } from './types'

/** Tabs cần state phía client để chuyển tab, các block khác render thuần server */
export function TabsRender({ node, attrs, children }: RenderProps) {
  const tabs = node.children ?? []
  const initial = Number(node.props.defaultIndex ?? 0) || 0
  const [active, setActive] = useState(initial)
  const idx = active >= 0 && active < tabs.length ? active : 0
  const panels = Children.toArray(children)

  const variant = typeof node.props.variant === 'string' && node.props.variant ? node.props.variant : 'underline'
  return (
    <div {...attrs} className={`${attrs.className} b-tabs--${variant}`}>
      <div className="b-tabs-nav" role="tablist">
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-controls={`panel-${tab.id}`}
            aria-selected={i === idx}
            data-tab-index={i}
            className="b-tabs-btn"
            onClick={() => setActive(i)}
          >
            {String(tab.props.title || `Tab ${i + 1}`)}
          </button>
        ))}
      </div>
      {panels.map((panel, i) => (
        <div
          key={tabs[i]?.id ?? i}
          id={tabs[i] ? `panel-${tabs[i].id}` : undefined}
          aria-labelledby={tabs[i] ? `tab-${tabs[i].id}` : undefined}
          className="b-tabs-panel"
          role="tabpanel"
          hidden={i !== idx}
        >
          {panel}
        </div>
      ))}
    </div>
  )
}
