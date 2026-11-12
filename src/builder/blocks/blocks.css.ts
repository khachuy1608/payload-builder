/** CSS cho các block UI (gắn vào BASE_CSS). Dùng token theme để đổi theme là đổi cả block. */
export const BLOCKS_CSS = `
.b-dialog-host>.b-button,.b-toast-host>.b-button,.b-menu-trigger,.b-tour-start{background:var(--color-primary);color:#fff;padding:10px 18px;cursor:pointer}
.b-button--ghost{background:transparent;color:var(--color-text);border:1px solid var(--color-border);padding:10px 16px}
.bld-editor-only{position:relative;margin-top:12px;padding:28px 12px 12px;border:1px dashed #a5b4fc;border-radius:8px;background:rgba(238,242,255,.5)}
.bld-editor-only-tag{position:absolute;left:8px;top:6px;font:11px/1.4 system-ui,sans-serif;color:#4f46e5}
/* ---- bố cục ---- */
.b-masonry{column-gap:var(--gap,16px)}
.b-masonry>*{break-inside:avoid;margin-bottom:var(--gap,16px)}
.b-bento{display:grid}
.b-card{display:flex;flex-direction:column}
.b-card--left{flex-direction:row}.b-card--right{flex-direction:row-reverse}
.b-card-media{width:100%;object-fit:cover;aspect-ratio:16/9}
.b-card--left .b-card-media,.b-card--right .b-card-media{width:40%;aspect-ratio:auto;flex:none}
.b-card-body{padding:20px;flex:1}
.b-marquee{overflow:hidden;white-space:nowrap;mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}
.b-marquee-track{display:flex;width:max-content;animation:bld-marquee var(--dur,25s) linear infinite;animation-direction:var(--dir,normal)}
.b-marquee.is-static .b-marquee-track{animation:none}
.b-marquee--pause:hover .b-marquee-track{animation-play-state:paused}
.b-marquee-group{display:flex;align-items:center;flex:none}
@keyframes bld-marquee{to{transform:translateX(-50%)}}
.b-carousel{position:relative}
.b-carousel-track{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;scroll-behavior:smooth}
.b-carousel-track::-webkit-scrollbar{display:none}
.b-carousel-track>*{flex:0 0 calc(100% / var(--per-view,1));scroll-snap-align:start}
.b-carousel-arrow{position:absolute;top:50%;transform:translateY(-50%);width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,.9);color:var(--color-text);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.15)}
.b-carousel-arrow--prev{left:12px}.b-carousel-arrow--next{right:12px}
.b-carousel-dots{display:flex;justify-content:center;gap:8px;padding:12px 0}
.b-carousel-dot{width:8px;height:8px;border-radius:50%;border:0;padding:0;background:var(--color-border);cursor:pointer;transition:transform .2s,background .2s}
.b-carousel-dot.is-active{background:var(--color-primary);transform:scale(1.25)}
.b-accordion{display:flex;flex-direction:column;border-top:1px solid var(--color-border)}
.b-acc-item{border-bottom:1px solid var(--color-border)}
.b-acc-summary{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 4px;cursor:pointer;font-weight:600;list-style:none}
.b-acc-summary::-webkit-details-marker{display:none}
.b-acc-chevron{transition:transform .2s;flex:none}
.b-acc-item[open] .b-acc-chevron{transform:rotate(180deg)}
.b-acc-panel{padding:0 4px 16px;color:var(--color-muted)}
/* ---- điều hướng ---- */
.b-header{position:relative;z-index:50}
.b-header--sticky{position:sticky;top:0}
.b-header-inner{display:flex;align-items:center;gap:24px;min-height:64px;max-width:1200px;margin:0 auto}
.b-header-brand{display:flex;align-items:center;gap:10px;font-weight:700;text-decoration:none;color:var(--color-secondary);font-size:18px}
.b-header-brand img{height:32px;width:auto}
.b-header-nav{display:flex;align-items:center;gap:22px;margin-left:auto}
.b-header-nav a{text-decoration:none;color:var(--color-text);font-weight:500}
.b-header-nav a:hover{color:var(--color-primary)}
.b-header-cta{background:var(--color-primary);color:#fff!important;padding:9px 16px}
.b-hamburger{display:none;margin-left:auto;border:0;background:none;cursor:pointer;color:var(--color-text);padding:6px}
.b-header-scrim{display:none}
@media (max-width:767px){
  .b-hamburger{display:inline-flex}
  .b-header-nav{position:fixed;top:0;bottom:0;width:min(320px,85vw);flex-direction:column;align-items:stretch;gap:4px;padding:72px 20px 20px;background:var(--color-background);box-shadow:0 0 40px rgba(0,0,0,.2);transition:transform .3s ease;z-index:60;margin:0}
  .b-header[data-drawer-side=right] .b-header-nav{right:0;transform:translateX(100%)}
  .b-header[data-drawer-side=left] .b-header-nav{left:0;transform:translateX(-100%)}
  .b-header.is-open .b-header-nav{transform:none}
  .b-header-nav a{padding:10px 8px;border-radius:var(--radius-sm)}
  .b-header-scrim{display:block;position:fixed;inset:0;background:rgba(15,23,42,.45);opacity:0;pointer-events:none;transition:opacity .3s;z-index:55}
  .b-header.is-open .b-header-scrim{opacity:1;pointer-events:auto}
  .b-header.is-open .b-hamburger{position:relative;z-index:61}
}
.b-breadcrumbs ol{display:flex;flex-wrap:wrap;gap:6px;list-style:none;margin:0;padding:0;font-size:14px}
.b-breadcrumbs li{display:flex;gap:6px;align-items:center}
.b-breadcrumbs a{color:var(--color-muted);text-decoration:none}.b-breadcrumbs a:hover{color:var(--color-primary)}
.b-breadcrumbs [aria-current]{color:var(--color-text);font-weight:600}
.b-breadcrumbs-sep{color:var(--color-border)}
.b-pagination{display:flex;align-items:center;gap:4px;flex-wrap:wrap}
.b-page-btn{display:inline-flex;align-items:center;gap:4px;min-width:36px;height:36px;padding:0 10px;justify-content:center;border-radius:var(--radius-sm);text-decoration:none;color:var(--color-text);font-size:14px}
.b-page-btn:hover{background:var(--color-surface)}
.b-page-btn.is-active{background:var(--color-primary);color:#fff}
.b-page-btn[aria-disabled=true]{opacity:.4;pointer-events:none}
.b-page-ellipsis{padding:0 6px;color:var(--color-muted)}
.b-pagination--dots{gap:8px}
.b-page-dot{width:8px;height:8px;border-radius:50%;background:var(--color-border)}
.b-page-dot.is-active{background:var(--color-primary);transform:scale(1.25)}
.b-steps{display:flex;gap:0;list-style:none;margin:0;padding:0;counter-reset:step}
.b-steps--vertical{flex-direction:column;gap:16px}
.b-step{display:flex;align-items:center;gap:10px;flex:1;position:relative;font-size:14px}
.b-steps--horizontal .b-step:not(:last-child)::after{content:'';flex:1;height:2px;background:var(--color-border);margin:0 8px}
.b-steps--horizontal .b-step.is-done::after{background:var(--color-primary)}
.b-step-circle{width:30px;height:30px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:600;flex:none;border:2px solid var(--color-border);color:var(--color-muted);background:var(--color-background)}
.b-step.is-done .b-step-circle{background:var(--color-primary);border-color:var(--color-primary);color:#fff}
.b-step.is-current .b-step-circle{border-color:var(--color-primary);color:var(--color-primary)}
.b-step-text{display:flex;flex-direction:column;line-height:1.3}
.b-step.is-current .b-step-label{font-weight:700;color:var(--color-text)}
.b-step-desc{font-size:12px;color:var(--color-muted)}
.b-toggle-group{display:inline-flex;gap:2px}
.b-toggle-group--segmented{background:var(--color-surface);border-radius:var(--radius-md);padding:3px}
.b-toggle-group--pills{gap:8px}
.b-toggle-btn{border:0;background:transparent;padding:7px 14px;border-radius:calc(var(--radius-md) - 2px);font:inherit;font-size:14px;color:var(--color-muted);cursor:pointer;text-decoration:none;transition:background .15s,color .15s}
.b-toggle-group--pills .b-toggle-btn{border:1px solid var(--color-border);border-radius:999px}
.b-toggle-btn.is-active{background:var(--color-background);color:var(--color-text);box-shadow:0 1px 2px rgba(0,0,0,.1);font-weight:600}
.b-toggle-group--pills .b-toggle-btn.is-active{background:var(--color-primary);border-color:var(--color-primary);color:#fff}
.b-bottom-nav{display:flex;justify-content:space-around;background:var(--color-background);border-top:1px solid var(--color-border);padding:6px 0 8px}
.b-bottom-nav--fixed{position:fixed;left:0;right:0;bottom:0;z-index:50}
.b-bottom-nav-item{display:flex;flex-direction:column;align-items:center;gap:4px;text-decoration:none;color:var(--color-muted);font-size:11px;min-width:64px}
.b-bottom-nav-item.is-active{color:var(--color-primary)}
.b-bottom-nav-icon{position:relative;display:inline-flex}
.b-badge-count{position:absolute;top:-6px;right:-8px;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#ef4444;color:#fff;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;line-height:1}
.b-float{position:fixed;bottom:24px;z-index:60;text-decoration:none;color:#fff;display:inline-flex;align-items:center;gap:10px}
.b-float--right{right:24px}.b-float--left{left:24px;flex-direction:row-reverse}
.b-float.is-editor{position:relative;bottom:auto;right:auto;left:auto}
.b-float--fab,.b-float--backToTop{width:52px;height:52px;border-radius:50%;background:var(--color-primary);justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.2)}
.b-float--backToTop{opacity:0;pointer-events:none;transition:opacity .3s}
.b-float--backToTop.is-visible,.b-float--backToTop.is-editor{opacity:1;pointer-events:auto}
.b-float-circle{width:56px;height:56px;border-radius:50%;background:var(--color-primary);display:inline-flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.2);flex:none}
.b-float-bubble{background:var(--color-background);color:var(--color-text);border:1px solid var(--color-border);border-radius:14px;padding:8px 12px;display:flex;flex-direction:column;box-shadow:0 8px 24px rgba(0,0,0,.12)}
.b-float-bubble small{color:var(--color-muted);font-size:12px}
.b-scrollspy{display:flex;flex-direction:column;gap:2px;font-size:14px;border-left:2px solid var(--color-border);padding-left:0}
.b-scrollspy--sticky{position:sticky;top:96px}
.b-scrollspy-title{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--color-muted);padding:0 0 6px 14px}
.b-scrollspy a{text-decoration:none;color:var(--color-muted);padding:4px 14px;margin-left:-2px;border-left:2px solid transparent}
.b-scrollspy a.is-active{color:var(--color-primary);border-left-color:var(--color-primary);font-weight:600}
[data-menu]{position:relative;display:inline-block}
.b-menu-panel{position:absolute;top:calc(100% + 6px);left:0;min-width:200px;background:var(--color-background);border:1px solid var(--color-border);border-radius:var(--radius-md);box-shadow:0 12px 32px rgba(15,23,42,.14);padding:6px;z-index:70;display:none;flex-direction:column}
[data-menu].is-open>.b-menu-panel,[data-menu].is-open>.b-pop-panel{display:flex}
.b-menu-item{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border-radius:var(--radius-sm);text-decoration:none;color:var(--color-text);font-size:14px;border:0;background:none;font:inherit;cursor:pointer;text-align:left}
.b-menu-item:hover{background:var(--color-surface)}
.b-menu-item.is-danger{color:#dc2626}
.b-overflow-btn,.b-waffle-btn{width:36px;height:36px;border-radius:var(--radius-sm);border:0;background:transparent;color:var(--color-text);display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
.b-overflow-btn:hover,.b-waffle-btn:hover{background:var(--color-surface)}
.b-waffle-panel{display:none;grid-template-columns:repeat(3,1fr);gap:4px;min-width:260px;padding:10px}
[data-menu].is-open>.b-waffle-panel{display:grid}
.b-waffle-app{display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 4px;border-radius:var(--radius-sm);text-decoration:none;color:var(--color-text);font-size:12px}
.b-waffle-app:hover{background:var(--color-surface)}
.b-waffle-app span{width:40px;height:40px;border-radius:12px;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:700}
.b-menu-trigger{display:inline-flex;align-items:center;gap:6px}
.b-menu-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}
.b-menu-li{position:relative}
.b-menu-arrow{color:var(--color-muted)}
.b-cascade--submenu .b-menu-sub{position:absolute;left:100%;top:0;min-width:180px;background:var(--color-background);border:1px solid var(--color-border);border-radius:var(--radius-md);box-shadow:0 12px 32px rgba(15,23,42,.14);padding:6px;display:none}
.b-cascade--submenu .b-menu-li:hover>.b-menu-sub,.b-cascade--submenu .b-menu-li:focus-within>.b-menu-sub{display:block}
.b-cascade--cascader .b-cascade-panel{flex-direction:row;align-items:flex-start}
.b-cascade--cascader .b-menu-sub{position:static;display:none;border-left:1px solid var(--color-border);padding-left:6px;margin-left:6px}
.b-cascade--cascader .b-menu-li:hover>.b-menu-sub,.b-cascade--cascader .b-menu-li.is-active>.b-menu-sub{display:flex}
.b-cascade--cascader [data-cascade-root]{flex-direction:row}
.b-cascade--cascader [data-cascade-root]>.b-menu-li{display:flex}
.b-cascade--drilldown .b-menu-sub{display:none}
.b-cascade--drilldown [data-cascade-root].is-drilled>.b-menu-li{display:none}
.b-cascade--drilldown [data-cascade-root].is-drilled>.b-menu-li.is-active{display:block}
.b-cascade--drilldown [data-cascade-root].is-drilled>.b-menu-li.is-active>.b-menu-item{display:none}
.b-cascade--drilldown [data-cascade-root].is-drilled>.b-menu-li.is-active>.b-menu-sub{display:flex}
.b-menu-back{color:var(--color-muted);font-size:13px}
.b-cmdk-btn{display:inline-flex;align-items:center;gap:10px;border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-muted);padding:8px 12px;border-radius:var(--radius-md);font:inherit;font-size:14px;cursor:pointer;min-width:240px}
.b-cmdk-btn span{flex:1;text-align:left}
.b-cmdk-btn kbd,.b-cmdk-input kbd,.b-cmdk-item kbd{font:11px/1 ui-monospace,monospace;border:1px solid var(--color-border);border-radius:4px;padding:3px 5px;color:var(--color-muted);background:var(--color-background)}
.b-cmdk-dialog{border:0;padding:0;background:transparent;width:min(560px,92vw);margin:12vh auto 0}
.b-cmdk-dialog::backdrop{background:rgba(15,23,42,.5);backdrop-filter:blur(2px)}
.b-cmdk-panel{background:var(--color-background);border:1px solid var(--color-border);border-radius:var(--radius-lg);box-shadow:0 24px 60px rgba(0,0,0,.3);overflow:hidden;color:var(--color-text)}
.b-cmdk-input{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--color-border)}
.b-cmdk-input input{flex:1;border:0;outline:0;font:inherit;font-size:15px;background:transparent;color:inherit}
.b-cmdk-list{max-height:320px;overflow-y:auto;padding:8px}
.b-cmdk-group-title{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--color-muted);padding:8px 10px 4px}
.b-cmdk-item{display:flex;justify-content:space-between;align-items:center;padding:9px 10px;border-radius:var(--radius-sm);text-decoration:none;color:var(--color-text);font-size:14px}
.b-cmdk-item:hover,.b-cmdk-item.is-active{background:var(--color-surface)}
.b-cmdk-empty{padding:16px;text-align:center;color:var(--color-muted);font-size:14px;margin:0}
.b-tour-list{font-size:13px;margin:0;padding-left:18px;color:var(--color-muted)}
.b-tour-spot{position:absolute;border-radius:8px;box-shadow:0 0 0 4px var(--color-primary),0 0 0 9999px rgba(15,23,42,.55);z-index:9998;pointer-events:none;transition:all .3s}
.b-tour-spot::before{content:'';position:absolute;inset:-14px;border-radius:14px;border:2px solid var(--color-primary);animation:bld-tour-beacon 1.6s ease-out infinite}
@keyframes bld-tour-beacon{0%{transform:scale(.85);opacity:.9}100%{transform:scale(1.15);opacity:0}}
.b-tour-card{position:absolute;z-index:9999;width:min(320px,90vw);background:var(--color-background);color:var(--color-text);border-radius:var(--radius-md);box-shadow:0 16px 40px rgba(0,0,0,.3);padding:16px;font-size:14px}
.b-tour-card b{display:block;margin-bottom:6px}
.b-tour-card-foot{display:flex;justify-content:space-between;align-items:center;margin-top:12px;gap:8px}
.b-tour-card-foot small{color:var(--color-muted)}
.b-tour-card button{border:0;background:var(--color-primary);color:#fff;padding:6px 12px;border-radius:var(--radius-sm);cursor:pointer;font:inherit;font-size:13px}
.b-tour-card button.b-tour-skip{background:transparent;color:var(--color-muted)}
/* ---- dữ liệu ---- */
.b-avatar-one{display:inline-flex;align-items:center;justify-content:center;overflow:hidden;background:color-mix(in srgb,var(--color-primary) 15%,var(--color-surface));color:var(--color-primary);font-weight:700;flex:none;line-height:1}
.b-avatar-one--circle{border-radius:50%}.b-avatar-one--rounded{border-radius:var(--radius-md)}
.b-avatar-one img{width:100%;height:100%;object-fit:cover}
.b-data-list{align-items:stretch}
.b-table-wrap{overflow-x:auto}
.b-table{width:100%;border-collapse:collapse;font-size:14px}
.b-table caption{caption-side:top;text-align:left;font-weight:600;padding:0 0 8px}
.b-table th,.b-table td{padding:10px 12px;border-bottom:1px solid var(--color-border)}
.b-table th{font-weight:600;color:var(--color-muted);font-size:12px;text-transform:uppercase;letter-spacing:.04em;background:var(--color-surface)}
.b-table--striped tbody tr:nth-child(even){background:color-mix(in srgb,var(--color-surface) 60%,transparent)}
.b-table--compact th,.b-table--compact td{padding:6px 8px}
.b-chart{display:flex;align-items:center;gap:24px;flex-wrap:wrap}
.b-chart-legend{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;font-size:14px}
.b-chart-legend li{display:flex;align-items:center;gap:8px}
.b-chart-legend span{width:12px;height:12px;border-radius:3px}
.b-chart-legend b{margin-left:auto;padding-left:12px}
.b-timeline{list-style:none;margin:0;padding:0 0 0 8px;border-left:2px solid var(--color-border);display:flex;flex-direction:column;gap:18px}
.b-timeline-item{position:relative;padding-left:20px;display:flex;gap:16px;font-size:14px}
.b-timeline-dot{position:absolute;left:-15px;top:4px;width:12px;height:12px;border-radius:50%;background:var(--color-background);border:2px solid var(--color-border)}
.b-timeline-item.is-current .b-timeline-dot{border-color:var(--color-primary);background:var(--color-primary);box-shadow:0 0 0 4px color-mix(in srgb,var(--color-primary) 25%,transparent)}
.b-timeline-time{color:var(--color-muted);min-width:64px;font-variant-numeric:tabular-nums}
.b-timeline-body{display:flex;flex-direction:column}
.b-timeline-body span{color:var(--color-muted)}
.b-avatars{display:inline-flex;align-items:center}
.b-avatar{width:var(--size,36px);height:var(--size,36px);border-radius:50%;background:var(--color-surface);color:var(--color-text);display:inline-flex;align-items:center;justify-content:center;font-size:calc(var(--size,36px)*.36);font-weight:600;border:2px solid var(--color-background);margin-left:calc(var(--size,36px)*-.28);overflow:hidden}
.b-avatar:first-child{margin-left:0}
.b-avatar img{width:100%;height:100%;object-fit:cover}
.b-avatar--more{background:var(--color-primary);color:#fff}
.b-status{display:inline-flex;align-items:center;gap:8px;font-size:14px}
.b-status-dot{width:10px;height:10px;border-radius:50%;background:#9ca3af;position:relative}
.b-status--online .b-status-dot{background:#22c55e}.b-status--away .b-status-dot{background:#f59e0b}.b-status--busy .b-status-dot,.b-status--live .b-status-dot{background:#ef4444}
.b-status.is-pulse .b-status-dot::after{content:'';position:absolute;inset:-4px;border-radius:50%;border:2px solid currentColor;color:inherit;animation:bld-tour-beacon 1.4s ease-out infinite;border-color:inherit}
.b-status--online.is-pulse .b-status-dot::after{border-color:#22c55e}.b-status--live.is-pulse .b-status-dot::after,.b-status--busy.is-pulse .b-status-dot::after{border-color:#ef4444}.b-status--away.is-pulse .b-status-dot::after{border-color:#f59e0b}
.b-chat{display:flex;flex-direction:column;max-width:420px;gap:3px}
.b-chat--me{align-items:flex-end;margin-left:auto}
.b-chat-name{font-size:12px;color:var(--color-muted);padding:0 6px}
.b-chat-bubble{padding:10px 14px;border-radius:18px;background:var(--color-surface);color:var(--color-text);white-space:pre-line;line-height:1.45}
.b-chat--them .b-chat-bubble{border-bottom-left-radius:4px}
.b-chat--me .b-chat-bubble{background:var(--color-primary);color:#fff;border-bottom-right-radius:4px}
.b-chat-meta{font-size:11px;color:var(--color-muted);padding:0 6px}
/* ---- phản hồi ---- */
.b-color--primary{--c:var(--color-primary);--c-bg:color-mix(in srgb,var(--color-primary) 14%,transparent)}
.b-color--neutral{--c:var(--color-muted);--c-bg:var(--color-surface)}
.b-color--success{--c:#15803d;--c-bg:#dcfce7}.b-color--warning{--c:#b45309;--c-bg:#fef3c7}.b-color--error{--c:#b91c1c;--c-bg:#fee2e2}.b-color--info{--c:#1d4ed8;--c-bg:#dbeafe}
.b-badge-wrap{position:relative;display:inline-flex;color:var(--color-text)}
.b-badge-wrap .b-badge-count{background:var(--c,#ef4444)}
.b-tag{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:500;line-height:1;padding:6px 10px;color:var(--c);background:var(--c-bg)}
.b-tag--pill{border-radius:999px}.b-tag--chip{border-radius:999px;border:1px solid var(--c)}.b-tag--tag{border-radius:var(--radius-sm);text-transform:uppercase;font-size:11px;letter-spacing:.05em;font-weight:700}
.b-tag-dot{width:7px;height:7px;border-radius:50%;background:var(--c)}
.b-tag-remove{border:0;background:transparent;color:inherit;display:inline-flex;cursor:pointer;padding:0;margin-left:2px}
.b-progress-head{display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;color:var(--color-muted)}
.b-progress-track{height:8px;border-radius:999px;background:var(--color-surface);overflow:hidden;position:relative}
.b-progress-fill{height:100%;border-radius:999px;background:var(--color-primary);transition:width .4s ease}
.b-progress-track.is-indeterminate .b-progress-fill{position:absolute;width:40%;animation:bld-indet 1.4s ease-in-out infinite}
@keyframes bld-indet{from{left:-40%}to{left:100%}}
.b-ring{display:inline-flex;flex-direction:column;align-items:center;gap:6px;position:relative}
.b-ring svg{transform:rotate(-90deg)}
.b-ring-track{fill:none;stroke:var(--color-surface);stroke-width:5}
.b-ring-fill{fill:none;stroke:var(--color-primary);stroke-width:5;stroke-linecap:round;transition:stroke-dashoffset .5s ease}
.b-ring.is-spinner svg{animation:bld-spin 1s linear infinite}
@keyframes bld-spin{to{transform:rotate(270deg)}}
.b-ring-value{position:absolute;top:0;left:50%;transform:translateX(-50%);height:var(--h);display:flex;align-items:center;font-size:13px;font-weight:600}
.b-ring-label{font-size:13px;color:var(--color-muted)}
.b-skeleton{display:flex;flex-direction:column;gap:10px}
.b-skel{display:block;border-radius:6px;background:var(--color-surface)}
.b-skeleton.is-animated .b-skel{background:linear-gradient(90deg,var(--color-surface) 25%,color-mix(in srgb,var(--color-surface) 50%,#fff) 50%,var(--color-surface) 75%);background-size:200% 100%;animation:bld-shimmer 1.4s linear infinite}
.b-skel-line{height:12px}.b-skel-image{height:140px;border-radius:var(--radius-md)}.b-skel-avatar{width:44px;height:44px;border-radius:50%;flex:none}
.b-skel-row{display:flex;gap:12px;align-items:center}.b-skel-col{flex:1;display:flex;flex-direction:column;gap:8px}
.b-empty{display:flex;flex-direction:column;align-items:center;gap:8px}
.b-empty-icon{width:72px;height:72px;border-radius:50%;background:var(--color-surface);color:var(--color-muted);display:inline-flex;align-items:center;justify-content:center;margin-bottom:8px}
.b-empty-title{margin:0;font-size:18px;font-family:var(--font-heading)}
.b-empty-text{margin:0;color:var(--color-muted);max-width:360px}
.b-empty-btn{margin-top:8px;background:var(--color-primary);color:#fff;padding:10px 18px}
.b-alert{display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border-radius:var(--radius-md);font-size:14px;background:var(--c-bg,var(--color-surface));color:var(--color-text)}
.b-alert--info{--c:#1d4ed8;--c-bg:#dbeafe}.b-alert--success{--c:#15803d;--c-bg:#dcfce7}.b-alert--warning{--c:#b45309;--c-bg:#fef3c7}.b-alert--error{--c:#b91c1c;--c-bg:#fee2e2}
.b-alert-icon{color:var(--c);flex:none;margin-top:1px}
.b-alert-body{flex:1;display:flex;flex-direction:column;gap:2px}
.b-alert--callout{border-left:4px solid var(--c);border-radius:0 var(--radius-md) var(--radius-md) 0}
.b-alert--banner{border-radius:0;justify-content:center;text-align:center}
.b-alert-btn{color:var(--c);font-weight:600;text-decoration:none;white-space:nowrap}
.b-alert-close{border:0;background:transparent;color:inherit;cursor:pointer;display:inline-flex;padding:2px;opacity:.7}
.b-alert.is-dismissed{display:none}
.b-toast-host{position:relative}
.b-toast-el{position:fixed;z-index:90;display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:var(--radius-md);background:#1f2937;color:#fff;font-size:14px;box-shadow:0 10px 30px rgba(0,0,0,.25);opacity:0;pointer-events:none;transform:translateY(12px);transition:opacity .25s,transform .25s}
.b-toast-el.is-visible,.b-toast-el.is-static{opacity:1;pointer-events:auto;transform:none}
.b-toast-el.is-static{position:static}
.b-toast--success{background:#15803d}.b-toast--error{background:#b91c1c}
.b-toast--bottom-center{left:50%;bottom:24px;transform:translate(-50%,12px)}.b-toast--bottom-center.is-visible{transform:translate(-50%,0)}
.b-toast--bottom-right{right:24px;bottom:24px}.b-toast--top-center{left:50%;top:24px;transform:translate(-50%,-12px)}.b-toast--top-center.is-visible{transform:translate(-50%,0)}.b-toast--top-right{right:24px;top:24px}
.b-toast-action{border:0;background:transparent;color:#a5b4fc;font-weight:600;cursor:pointer;font:inherit}
.b-toast-close{border:0;background:transparent;color:inherit;cursor:pointer;display:inline-flex;opacity:.7}
/* ---- lớp phủ ---- */
.b-dialog-el{border:0;padding:0;background:transparent;max-width:none;max-height:none;overflow:visible}
.b-dialog-el::backdrop{background:rgba(15,23,42,.5)}
.b-dialog-box{background:var(--color-background);color:var(--color-text);display:flex;flex-direction:column;box-shadow:0 24px 60px rgba(0,0,0,.3)}
.b-dialog-box--modal{width:min(520px,92vw);border-radius:var(--radius-lg)}
.b-dialog--modal{margin:auto}
.b-dialog--drawer{margin:0;height:100vh;max-height:100vh}
.b-dialog-box--drawer{width:min(420px,88vw);height:100vh}
.b-dialog--drawer:has(.b-dialog-box--right){margin-left:auto}.b-dialog--drawer:has(.b-dialog-box--left){margin-right:auto}
.b-dialog--sheet{margin:auto 0 0;width:100vw;max-width:100vw}
.b-dialog-box--sheet{width:100vw;border-radius:var(--radius-lg) var(--radius-lg) 0 0;max-height:85vh}
.b-dialog-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--color-border);font-size:16px}
.b-dialog-x{border:0;background:transparent;cursor:pointer;color:var(--color-muted);display:inline-flex}
.b-dialog-body{padding:20px;overflow-y:auto}
.b-dialog-foot{padding:12px 20px;border-top:1px solid var(--color-border);display:flex;justify-content:flex-end;gap:8px}
.bld-editor-only .b-dialog-box{box-shadow:0 4px 16px rgba(0,0,0,.1);width:auto;height:auto;max-height:none}
.b-pop{position:relative;display:inline-block}
.b-pop-trigger{display:inline-flex;align-items:center;gap:6px}
.b-pop-trigger-text{border:0;background:none;font:inherit;color:var(--color-primary);text-decoration:underline dotted;cursor:help;padding:0}
.b-pop-panel{position:absolute;left:0;z-index:70;display:none}
.b-pop--bottom .b-pop-panel{top:calc(100% + 8px)}.b-pop--top .b-pop-panel{bottom:calc(100% + 8px)}
.b-pop.is-open>.b-pop-panel,[data-hover]:hover>.b-pop-panel,[data-hover]:focus-within>.b-pop-panel{display:flex}
.b-pop-card{min-width:260px;max-width:360px;background:var(--color-background);border:1px solid var(--color-border);border-radius:var(--radius-md);box-shadow:0 12px 32px rgba(15,23,42,.14);padding:14px;flex-direction:column}
.b-tooltip{background:#1f2937;color:#fff;font-size:12px;padding:6px 10px;border-radius:6px;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,.2)}
.b-hovercard{min-width:300px}
.b-gallery{display:grid}
.b-gallery-item{border:0;padding:0;background:var(--color-surface);cursor:zoom-in;border-radius:var(--radius-sm);overflow:hidden;aspect-ratio:4/3}
.b-gallery-item img{width:100%;height:100%;object-fit:cover;transition:transform .3s}
.b-gallery-item:hover img{transform:scale(1.04)}
.b-lightbox-dlg{border:0;background:transparent;padding:0;width:100vw;height:100vh;max-width:100vw;max-height:100vh;margin:0}
.b-lightbox-dlg::backdrop{background:rgba(0,0,0,.9)}
.b-lightbox-dlg figure{margin:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:48px}
.b-lightbox-dlg img{max-width:100%;max-height:85vh;width:auto;height:auto;object-fit:contain;border-radius:4px}
.b-lightbox-dlg figcaption{color:#fff;font-size:14px;opacity:.85}
.b-lightbox-close,.b-lightbox-nav{position:absolute;border:0;background:rgba(255,255,255,.12);color:#fff;width:44px;height:44px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
.b-lightbox-close{top:16px;right:16px}.b-lightbox-prev{left:16px;top:50%;transform:translateY(-50%)}.b-lightbox-next{right:16px;top:50%;transform:translateY(-50%)}
/* ---- form ---- */
.b-form{color:var(--color-text)}
.b-form-hp{position:absolute;left:-9999px;opacity:0;height:0;width:0}
.b-form-msg{margin:0;font-size:14px;padding:10px 12px;border-radius:var(--radius-sm);background:#dcfce7;color:#15803d}
.b-form-msg.is-error{background:#fee2e2;color:#b91c1c}
.b-field{display:flex;flex-direction:column;gap:6px;border:0;padding:0;margin:0;min-width:0}
.b-field-label{font-size:14px;font-weight:500}
.b-field-req{color:#dc2626}
.b-input{width:100%;font:inherit;font-size:15px;padding:10px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);background:var(--color-background);color:var(--color-text);min-width:0}
.b-input:focus{outline:2px solid var(--color-primary);outline-offset:-1px}
.b-input--resize{resize:vertical}
textarea.b-input{resize:none}
.b-field-help{font-size:12px;color:var(--color-muted)}
.b-field-error{font-size:12px;color:#dc2626}
.b-field.is-error .b-input{border-color:#dc2626}
.b-input-wrap{position:relative}
.b-input-wrap .b-input{padding-right:40px}
.b-input-eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);border:0;background:transparent;color:var(--color-muted);cursor:pointer;display:inline-flex;padding:6px}
.b-choice{display:flex;align-items:center;gap:10px;font-size:15px;cursor:pointer}
.b-choice input{position:absolute;opacity:0;width:0;height:0}
.b-choice-box{width:18px;height:18px;border:2px solid var(--color-border);border-radius:4px;display:inline-flex;align-items:center;justify-content:center;flex:none;transition:background .15s,border-color .15s}
.b-choice input[type=radio]+.b-choice-box{border-radius:50%}
.b-choice input:checked+.b-choice-box{background:var(--color-primary);border-color:var(--color-primary)}
.b-choice input[type=checkbox]:checked+.b-choice-box::after{content:'';width:5px;height:9px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg) translate(-1px,-1px)}
.b-choice input[type=radio]:checked+.b-choice-box::after{content:'';width:8px;height:8px;border-radius:50%;background:#fff}
.b-choice input:focus-visible+.b-choice-box{outline:2px solid var(--color-primary);outline-offset:2px}
.b-switch{display:flex;align-items:center;gap:10px;cursor:pointer;font-size:15px}
.b-switch input{position:absolute;opacity:0;width:0;height:0}
.b-switch-track{width:40px;height:22px;border-radius:999px;background:var(--color-border);position:relative;transition:background .2s;flex:none}
.b-switch-track::after{content:'';position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .2s;box-shadow:0 1px 2px rgba(0,0,0,.2)}
.b-switch input:checked+.b-switch-track{background:var(--color-primary)}
.b-switch input:checked+.b-switch-track::after{transform:translateX(18px)}
.b-multi-chips{display:flex;flex-wrap:wrap;gap:6px}
.b-multi-chips span{font-size:12px;padding:4px 8px;border-radius:999px;background:var(--color-surface)}
.b-form-actions{display:flex;gap:8px}
.b-form-step{padding:8px 0;border-top:1px dashed var(--color-border)}.b-form-step-label{font-size:12px;font-weight:600;color:var(--color-muted);text-transform:uppercase;letter-spacing:.04em}
.b-form-stepbox{display:none;border:0;padding:0;margin:0;min-width:0}.b-form-stepbox.is-active{display:flex;flex-direction:column;gap:14px}
.b-form-steps{display:flex;gap:8px;list-style:none;margin:0 0 8px;padding:0;counter-reset:step}.b-form-steps li{flex:1;display:flex;align-items:center;gap:8px;font-size:13px;color:var(--color-muted);counter-increment:step}.b-form-steps li::before{content:counter(step);width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:var(--color-surface);border:1px solid var(--color-border);font-size:12px;font-weight:600}.b-form-steps li.is-active{color:var(--color-text);font-weight:600}.b-form-steps li.is-active::before,.b-form-steps li.is-done::before{background:var(--color-primary);color:#fff;border-color:var(--color-primary)}
.b-input--file{padding:8px}[hidden]{display:none!important}
.b-form-submit{background:var(--color-primary);color:#fff;padding:11px 22px;cursor:pointer}
.b-form-submit[disabled]{opacity:.6}
.b-signin{display:flex;flex-direction:column;gap:14px}
.b-auth-wrap{display:flex;flex-direction:column;gap:20px}.b-auth-wrap .b-auth--password{padding-top:16px;border-top:1px solid var(--color-border)}.b-auth-text{margin:0;color:var(--color-muted);font-size:14px}.b-auth-logout{align-self:flex-start}
.b-signin-title{margin:0 0 4px;font-family:var(--font-heading);font-size:22px}
.b-signin-providers{display:flex;flex-direction:column;gap:8px}
.b-signin-provider{text-align:center;justify-content:center}
.b-signin-or{display:flex;align-items:center;gap:12px;color:var(--color-muted);font-size:13px}
.b-signin-or::before,.b-signin-or::after{content:'';flex:1;height:1px;background:var(--color-border)}
.b-signin-row{display:flex;justify-content:space-between;align-items:center;font-size:14px}
.b-signin-row a{color:var(--color-primary);text-decoration:none}
.b-signin-submit{background:var(--color-primary);color:#fff;padding:11px 18px;text-align:center;cursor:pointer}
.b-signin-foot{margin:0;text-align:center;font-size:14px;color:var(--color-muted)}
.b-signin-foot a{color:var(--color-primary)}
/* ---- tabs biến thể ---- */
.b-tabs--pills .b-tabs-nav{border:0;gap:8px}
.b-tabs--pills .b-tabs-btn{border:1px solid var(--color-border);border-radius:999px;margin:0;padding:8px 16px}
.b-tabs--pills .b-tabs-btn[aria-selected=true]{background:var(--color-primary);border-color:var(--color-primary);color:#fff}
.b-tabs--segmented .b-tabs-nav{border:0;gap:2px;background:var(--color-surface);border-radius:var(--radius-md);padding:3px;width:max-content}
.b-tabs--segmented .b-tabs-btn{border:0;border-radius:calc(var(--radius-md) - 2px);margin:0;padding:7px 14px}
.b-tabs--segmented .b-tabs-btn[aria-selected=true]{background:var(--color-background);color:var(--color-text);box-shadow:0 1px 2px rgba(0,0,0,.1)}
.b-tabs--vertical{display:flex;gap:24px;align-items:flex-start}
.b-tabs--vertical .b-tabs-nav{flex-direction:column;border:0;border-right:1px solid var(--color-border);gap:2px;min-width:160px}
.b-tabs--vertical .b-tabs-btn{text-align:left;border:0;border-right:2px solid transparent;margin:0 -1px 0 0}
.b-tabs--vertical .b-tabs-btn[aria-selected=true]{border-right-color:var(--color-primary)}
.b-tabs--vertical .b-tabs-panel{flex:1}
/* ---- tìm kiếm ---- */
.b-search-row{display:flex;align-items:center;gap:8px;position:relative}
.b-search-icon{position:absolute;left:12px;color:var(--color-muted);pointer-events:none}
.b-search-input{padding-left:38px}
.b-search-btn{background:var(--color-primary);color:#fff;padding:10px 16px;cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center}
.b-search-total{margin:8px 0 0;font-size:13px;color:var(--color-muted)}
/* ---- divider ---- */
.b-divider--labeled{display:flex;align-items:center;gap:12px;color:var(--color-muted);font-size:13px;background:none!important;height:auto!important}
.b-divider--labeled::before,.b-divider--labeled::after{content:'';flex:1;height:1px;background:var(--color-border)}
.b-divider--vertical{width:1px!important;height:auto!important;align-self:stretch;min-height:24px}
`
export const DATA_CSS = ''
