import { useEffect, useRef, useState } from 'react'

const media = (file) => `/제품%20이미지및%20영상/${file}`

const products = [
  { id: 'moray', index: '01', title: 'MORAY / MAGSAFE HOLDER', kind: '맥세이프 카드 홀더', image: 'OSSIUM_맥세이프카드홀더_악어골격_01.png', note: '모레이의 곡선과 입구를 손에 남는 카드 홀더의 구조로 재해석했습니다.', specs: [['FORM', '모레이의 곡선'], ['FUNCTION', '맥세이프 / 카드 수납'], ['CAPACITY', '카드 최대 3장'], ['PROCESS', '레이어드 3D 프린팅']] },
  { id: 'shark', index: '02', title: 'SHARK / AIRPODS CASE', kind: '에어팟 케이스', image: 'OSSIUM_에어팟케이스_상어골격_02.png', note: '상어 골격의 입구를, 매일 꺼내는 물건의 보호 구조로 바꿨습니다.', specs: [['FORM', '상어 골격의 입구'], ['FUNCTION', '에어팟 수납 / 보호'], ['CAPACITY', '에어팟 케이스 1개'], ['PROCESS', '레이어드 3D 프린팅']] },
  { id: 'nautilus', index: '03', title: 'NAUTILUS / AIRPODS CASE', kind: '에어팟 케이스', image: 'OSSIUM_에어팟케이스_앵무조개_01.png', note: '앵무조개의 나선 구조를 열리고 닫히는 개인 수납 오브제로 바꿨습니다.', specs: [['FORM', '앵무조개의 나선'], ['FUNCTION', '에어팟 수납 / 보호'], ['CAPACITY', '에어팟 케이스 1개'], ['PROCESS', '레이어드 3D 프린팅']] },
  { id: 'whale', index: '04', title: 'WHALE / KEYCHAIN', kind: '키체인', image: 'OSSIUM_키체인_해양골격_01.png', note: '가벼운 골격의 흐름이 손과 물건을 이어 주는 작은 연결점이 됩니다.', specs: [['FORM', '해양 골격의 선'], ['FUNCTION', '키링 / 연결'], ['CAPACITY', '열쇠와 소형 오브제'], ['PROCESS', '레이어드 3D 프린팅']] },
  { id: 'fossil', index: '05', title: 'FOSSIL / LIGHTER CASE', kind: '라이터 케이스', image: 'OSSIUM_라이터케이스_골격_01.png', note: '겹쳐진 골격의 빈 공간이 작은 도구를 감싸고, 꺼내는 동작을 남깁니다.', specs: [['FORM', '겹친 골격의 빈 공간'], ['FUNCTION', '라이터 수납 / 보호'], ['CAPACITY', '라이터 1개'], ['PROCESS', '레이어드 3D 프린팅']] },
]

function useScrollFilm(ref) {
  useEffect(() => {
    const section = ref.current
    const video = section?.querySelector('video')
    if (!section || !video || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    let frame = 0
    let seeking = false
    let target = 0
    const update = () => {
      frame = 0
      if (!Number.isFinite(video.duration) || !video.duration) return
      const rect = section.getBoundingClientRect()
      const travel = Math.max(1, section.offsetHeight - window.innerHeight)
      target = Math.max(0, Math.min(video.duration - 0.03, (-rect.top / travel) * video.duration))
      if (!seeking && Math.abs(video.currentTime - target) > 0.025) { seeking = true; video.currentTime = target }
    }
    const request = () => { if (!frame) frame = requestAnimationFrame(update) }
    const done = () => { seeking = false; request() }
    window.addEventListener('scroll', request, { passive: true })
    window.addEventListener('resize', request)
    video.addEventListener('seeked', done)
    video.addEventListener('loadedmetadata', request, { once: true })
    request()
    return () => { window.removeEventListener('scroll', request); window.removeEventListener('resize', request); video.removeEventListener('seeked', done); if (frame) cancelAnimationFrame(frame) }
  }, [ref])
}

function Chapter({ index, children, id, className = '' }) {
  return <section id={id} className={`chapter snap-start relative min-h-dvh ${className}`}><div className="chapter-number">{index}</div>{children}</section>
}

function SpecList({ specs }) {
  return <dl className="border-t border-white/25">{specs.map(([term, value]) => <div key={term} className="flex min-h-12 items-center justify-between gap-5 border-b border-white/15 py-2.5 text-xs"><dt className="text-[10px] font-bold tracking-[.13em] text-slate-400">{term}</dt><dd className="m-0 text-right font-medium text-slate-100">{value}</dd></div>)}</dl>
}

function Header() {
  return <header className="fixed inset-x-0 top-0 z-50 h-[74px] border-b border-white/10 bg-black/70 backdrop-blur-xl"><div className="page-shell grid h-full grid-cols-[1fr_auto_1fr] items-center"><a className="brand-logo" href="#top" aria-label="OSSIUM 처음으로"><img src={media('OSSIUM_로고_악어골격_02.png')} alt="OSSIUM" /></a><nav className="hidden gap-8 text-[10px] font-bold tracking-[.13em] md:flex" aria-label="주요 메뉴"><a href="#moray">MORAY</a><a href="#archive">OBJECTS</a><a href="#contact">CONTACT</a></nav><a className="justify-self-end text-[10px] font-bold tracking-[.13em]" href="#archive">SHOP ↗</a></div></header>
}

function App() {
  const [selected, setSelected] = useState(null)
  const [colour, setColour] = useState('blue')
  const structureRef = useRef(null)
  const motionRef = useRef(null)
  useScrollFilm(structureRef)
  useScrollFilm(motionRef)

  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && setSelected(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return <div className="bg-black text-[#f4f6fa] selection:bg-[#a7c2ff] selection:text-black">
    <Header />
    <main className="snap-y snap-proximity">
      <Chapter id="top" index="01" className="hero-screen flex items-center overflow-hidden pt-[74px]">
        <div className="page-shell grid w-full grid-cols-4 items-center gap-x-3 py-12 md:grid-cols-8 md:gap-x-5 lg:grid-cols-12 lg:gap-x-6">
          <div className="z-10 col-span-4 lg:col-span-5"><p className="eyebrow">OSSIUM / OBJECT STUDY / 2026</p><h1 className="display mt-5 text-[15vw] leading-[.78] sm:text-[12vw] lg:text-[7.5rem]">NATURE'S<br />STRUCTURE,<br /><span className="text-[#a7c2ff]">HELD.</span></h1><p className="mt-8 max-w-[31ch] text-[15px] leading-7 text-slate-300">손에 오래 남는 곡선으로 만든 모레이 맥세이프 카드 홀더.</p></div>
          <figure className="hero-object pointer-events-none col-span-4 mt-12 lg:col-span-7 lg:mt-0"><img src={media('OSSIUM_로고_악어골격_04.png')} alt="OSSIUM 3D 골격 로고" /><figcaption>OSSIUM / 3D MARK</figcaption></figure>
          <div className="col-span-4 mt-12 flex justify-between border-t border-white/20 pt-3 text-[10px] tracking-[.14em] text-slate-400 md:col-span-8 lg:col-span-12"><span>SCROLL TO EXPLORE</span><span>01 / 07</span></div>
        </div>
      </Chapter>

      <section ref={structureRef} id="structure" className="relative h-[240dvh] bg-black"><div className="sticky top-0 grid min-h-dvh place-items-center overflow-hidden"><video className="absolute inset-0 h-full w-full object-cover opacity-90" muted playsInline preload="metadata"><source src={media('곰치%20멕세이프%20케이스.mp4')} type="video/mp4" /></video><div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_45%,transparent,rgba(0,0,0,.58)_72%)]" /><div className="page-shell relative z-10 grid w-full grid-cols-4 md:grid-cols-8 lg:grid-cols-12"><div className="col-span-4 lg:col-span-5"><p className="eyebrow">02 / STRUCTURE FILM</p><h2 className="display mt-5 text-[17vw] leading-[.78] sm:text-[11vw] lg:text-[7rem]">WHAT<br />HOLDS<br />THE <span className="text-[#a7c2ff]">FORM.</span></h2><p className="mt-7 max-w-[26ch] text-[15px] leading-7 text-slate-200">스크롤하며 케이스 안쪽의 골격 구조를 살펴보세요.</p></div></div><div className="page-shell absolute bottom-8 z-10 flex w-full justify-between border-t border-white/25 pt-3 text-[10px] font-bold tracking-[.14em] text-slate-300"><span>SCROLL TO SCRUB</span><span>0001 — 0150</span></div></div></section>

      <Chapter index="03" className="flex items-center bg-[#f4f3ef] text-[#080a0d]"><div className="page-shell w-full"><p className="eyebrow text-slate-600">03 / PROCESS RECORD</p><div className="mt-6 grid grid-cols-4 gap-3 md:grid-cols-8 md:gap-5 lg:grid-cols-12 lg:gap-6"><h2 className="display col-span-4 text-[17vw] leading-[.77] sm:text-[10vw] lg:col-span-8 lg:text-[7.5rem]">PROCESS<br /><span className="text-[#7899e2]">IN FOUR.</span></h2><p className="col-span-4 self-end pb-3 text-[15px] leading-7 lg:col-span-3 lg:col-start-10">스케치부터 모델링, 출력과 가공까지. 구조가 오브제가 되는 과정을 기록합니다.</p></div><div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">{['스케치', '모델링', '출력', '가공'].map((label, i) => <article key={label}><div className="aspect-[4/5] overflow-hidden bg-black"><img className="process-panel" style={{ transform: `translateX(-${i * 25}%)` }} src={media('OSSIUM_공정_스케치_모델링_출력_가공.png')} alt={`${label} 공정 이미지`} /></div><p className="mt-3 text-[11px] font-bold tracking-[.11em]">0{i + 1} / {label}</p></article>)}</div></div></Chapter>

      <Chapter id="moray" index="04" className="flex items-center bg-black"><div className="page-shell grid w-full grid-cols-4 items-center gap-3 md:grid-cols-8 md:gap-5 lg:grid-cols-12 lg:gap-6"><div className="col-span-4 lg:col-span-5"><p className="eyebrow">04 / MORAY MAGSAFE HOLDER</p><h2 className="display mt-5 text-[17vw] leading-[.78] sm:text-[11vw] lg:text-[7rem]">THE GRIP<br />HAS A<br />MEMORY.</h2><div className="mt-10"><SpecList specs={products[0].specs} /></div></div><figure className="col-span-4 mt-10 overflow-hidden bg-[#040609] lg:col-span-7 lg:mt-0"><img className="h-full w-full object-contain" src={media('OSSIUM_맥세이프카드홀더_악어골격_02.png')} alt="오프화이트 모레이 맥세이프 카드 홀더" /></figure></div></Chapter>

      <section ref={motionRef} className="relative h-[220dvh] bg-black"><div className="sticky top-0 flex min-h-dvh items-center overflow-hidden"><div className="page-shell grid w-full grid-cols-4 items-center gap-3 md:grid-cols-8 md:gap-5 lg:grid-cols-12 lg:gap-6"><div className="z-10 col-span-4 lg:col-span-4"><p className="eyebrow">05 / KINEMATIC STUDY</p><h2 className="display mt-5 text-[18vw] leading-[.78] sm:text-[11vw] lg:text-[7rem] text-[#e5f06e]">OPEN.<br />HOLD.<br />RELEASE.</h2></div><video className="col-span-4 mt-10 aspect-[16/10] w-full bg-[#05070a] object-cover lg:col-span-7 lg:col-start-6 lg:mt-0" muted playsInline preload="metadata"><source src={media('곰치%20멕세이프%20케이스.mp4')} type="video/mp4" /></video></div></div></section>

      <Chapter index="06" className="relative flex items-center overflow-hidden bg-[#0b1018]"><div className="page-shell grid w-full grid-cols-4 items-center gap-3 md:grid-cols-8 md:gap-5 lg:grid-cols-12 lg:gap-6"><div className="z-10 col-span-4 lg:col-span-5"><p className="eyebrow">06 / COLOUR STUDY</p><h2 className="display mt-5 text-[18vw] leading-[.78] sm:text-[11vw] lg:text-[7rem]">COLD<br />CURRENT.</h2><div className="mt-10 flex gap-3">{[['blue', 'ICE BLUE'], ['white', 'OFF WHITE']].map(([key, label]) => <button key={key} onClick={() => setColour(key)} aria-pressed={colour === key} className={`min-h-11 border-b px-1 text-[11px] font-bold tracking-[.12em] ${colour === key ? 'border-[#e5f06e] text-white' : 'border-transparent text-slate-400'}`}>{label}</button>)}</div></div><img className="col-span-4 mt-10 h-full w-full object-contain lg:col-span-7 lg:mt-0" src={media(colour === 'blue' ? 'OSSIUM_맥세이프카드홀더_악어골격_01.png' : 'OSSIUM_맥세이프카드홀더_악어골격_02.png')} alt={`${colour === 'blue' ? '아이스 블루' : '오프화이트'} 모레이 홀더`} /></div></Chapter>

      <Chapter id="archive" index="07" className="bg-black py-28"><div className="page-shell"><p className="eyebrow">07 / COMPLETE ARCHIVE</p><div className="mt-5 flex flex-wrap items-end justify-between gap-8"><h2 className="display text-[16vw] leading-[.78] sm:text-[10vw] lg:text-[7rem]">OBJECT<br />RECORDS.</h2><p className="max-w-[31ch] text-[15px] leading-7 text-slate-300">모든 오브제를 선택해 형태와 쓰임, 제작 방식을 확인하세요.</p></div><div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5 lg:grid-cols-12 lg:gap-6">{products.map((product, i) => <button key={product.id} onClick={() => setSelected(product)} className={`archive-card group text-left ${i < 2 ? 'col-span-2 lg:col-span-6' : 'col-span-1 lg:col-span-4'}`}><span className="block overflow-hidden bg-[#05070a]"><img src={media(product.image)} alt="" className="aspect-[4/3] w-full object-contain transition duration-500 group-hover:scale-105" /></span><span className="mt-3 flex items-center justify-between text-[10px] font-bold tracking-[.12em]"><span>{product.index} / {product.title}</span><span aria-hidden>↗</span></span></button>)}</div></div></Chapter>
    </main>
    <footer id="contact" className="bg-[#a7c2ff] py-16 text-black"><div className="page-shell"><p className="text-[10px] font-bold tracking-[.14em]">OSSIUM / SEOUL / 2026</p><h2 className="display mt-12 text-[17vw] leading-[.76] sm:text-[10vw] lg:text-[8rem]">REMEMBER<br />WHAT REMAINS.</h2><div className="mt-16 flex flex-wrap justify-between gap-6 border-t border-black/25 pt-4 text-sm"><a href="mailto:studio@ossium.kr">studio@ossium.kr</a><span>© 2026 OSSIUM</span></div></div></footer>
    {selected && <div role="dialog" aria-modal="true" aria-labelledby="archive-title" className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}><div className="grid max-h-[calc(100dvh-32px)] w-full max-w-5xl overflow-auto border border-white/20 bg-[#080a0e] md:grid-cols-[1.08fr_1fr]"><div className="min-h-80 bg-[#030508]"><img className="h-full w-full object-contain" src={media(selected.image)} alt={selected.title} /></div><div className="flex min-h-96 flex-col p-7 sm:p-10"><button className="ml-auto -mt-3 -mr-3 min-h-11 min-w-11 text-3xl text-slate-200" onClick={() => setSelected(null)} aria-label="아카이브 닫기">×</button><p className="eyebrow mt-5">OSSIUM / ARCHIVE / {selected.index}</p><h2 id="archive-title" className="display mt-4 text-5xl leading-[.82]">{selected.title}</h2><p className="mt-6 max-w-[36ch] text-[15px] leading-7 text-slate-300">{selected.note}</p><div className="mt-8"><SpecList specs={[['TYPE', selected.kind], ...selected.specs]} /></div><a href="mailto:studio@ossium.kr?subject=OSSIUM%20Archive%20Inquiry" className="mt-auto pt-10 text-[11px] font-bold tracking-[.12em] text-[#a7c2ff]">INQUIRE ↗</a></div></div></div>}
  </div>
}

export default App
