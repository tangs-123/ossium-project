const colour = document.querySelector('.colour');
const swatches = document.querySelectorAll('.swatch');
const header = document.querySelector('.site-header');
const motionSection = document.querySelector('.motion-section');
const motionSticky = document.querySelector('.motion-sticky');
const motionSteps = document.querySelectorAll('.motion-steps li');
const navLinks = document.querySelectorAll('.site-header nav a');
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const archiveDialog = document.querySelector('.archive-dialog');
const archiveTriggers = document.querySelectorAll('.archive-trigger');
const chapterLinks = document.querySelectorAll('[data-chapter-link]');
const chapterTargets = [...chapterLinks].map((link) => document.getElementById(link.dataset.chapterLink)).filter(Boolean);
const pageSections = document.querySelectorAll('main > section');
const heroSection = document.querySelector('.hero');
const structureSteps = document.querySelectorAll('.structure-steps li');
  const scrollFilms = [...document.querySelectorAll('[data-scroll-video]')].map((video) => ({
  video,
  section: video.closest('[data-scroll-section]') || video.closest('.motion-section'),
  duration: 0,
  targetTime: 0,
  isSeeking: false,
  }));
  const structureSection = document.querySelector('.structure-scroll');

function setColour(swatch) {
  const isWhite = swatch.dataset.colour === 'white';
  colour.classList.toggle('is-white', isWhite);
  swatches.forEach((item) => {
    const selected = item === swatch;
    item.classList.toggle('is-selected', selected);
    item.setAttribute('aria-pressed', String(selected));
  });
}

swatches.forEach((swatch) => {
  swatch.addEventListener('click', () => setColour(swatch));
  swatch.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const index = [...swatches].indexOf(swatch);
    const next = event.key === 'ArrowRight' ? (index + 1) % swatches.length : (index - 1 + swatches.length) % swatches.length;
    swatches[next].focus();
    setColour(swatches[next]);
  });
});

function updateScrollState() {
  header.classList.toggle('is-scrolled', window.scrollY > 24);
    if (heroSection) {
    const heroProgress = Math.min(1, Math.max(0, -heroSection.getBoundingClientRect().top / Math.max(1, window.innerHeight)));
    document.documentElement.style.setProperty('--hero-x', `${-heroProgress * window.innerWidth * 0.04}px`);
    document.documentElement.style.setProperty('--hero-y', `${-heroProgress * window.innerHeight * 0.02}px`);
    document.documentElement.style.setProperty('--hero-scale', String(0.92 + heroProgress * 0.08));
      document.documentElement.style.setProperty('--hero-rotate', `${-2 + heroProgress * 5}deg`);
    }
    if (structureSection) {
      const structureProgress = scrollProgress(structureSection);
      document.documentElement.style.setProperty('--structure-scale', String(0.94 + structureProgress * 0.06));
      document.documentElement.style.setProperty('--structure-y', `${structureProgress * -20}px`);
      const stage = Math.min(5, Math.floor(structureProgress * 5) + 1);
      structureSteps.forEach((item, index) => item.classList.toggle('is-active', index + 1 === stage));
    }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (motionSection) {
    const progress = scrollProgress(motionSection);
    const step = Math.min(3, Math.floor(progress * 3) + 1);
    motionSticky.dataset.step = String(step);
    motionSteps.forEach((item, index) => item.classList.toggle('is-active', index + 1 === step));
  }
  scrollFilms.forEach((film) => scrubVideo(film, scrollProgress(film.section)));
}

function scrollProgress(section) {
  if (!section) return 0;
  const bounds = section.getBoundingClientRect();
  const travel = Math.max(1, section.offsetHeight - window.innerHeight);
  return Math.min(0.999, Math.max(0, -bounds.top / travel));
}

function scrubVideo(film, progress) {
  if (!film.duration) return;
  film.targetTime = Math.min(film.duration - 0.04, Math.max(0, progress * film.duration));
  requestFilmSeek(film);
}

function requestFilmSeek(film) {
  if (film.isSeeking || film.seekFrame) return;
  film.seekFrame = window.requestAnimationFrame(() => {
    film.seekFrame = 0;
    seekToScrollFrame(film);
  });
}

function seekToScrollFrame(film) {
  if (film.isSeeking) return;
  const difference = film.targetTime - film.video.currentTime;
  if (Math.abs(difference) < 0.014) return;
  // Ease toward the requested frame. This keeps the film continuous while supporting reverse scroll.
  const nextFrame = film.video.currentTime + difference * 0.22;
  film.isSeeking = true;
  film.video.currentTime = nextFrame;
}

scrollFilms.forEach((film) => {
  film.video.addEventListener('loadedmetadata', () => {
    film.duration = Number.isFinite(film.video.duration) ? film.video.duration : 0;
    film.video.pause();
    updateScrollState();
  }, { once: true });
  film.video.addEventListener('seeked', () => {
    film.isSeeking = false;
    requestFilmSeek(film);
  });
});

function syncAmbientVideoMotion() {
  document.querySelectorAll('video[autoplay]').forEach((video) => {
    if (reducedMotionQuery.matches) video.pause();
    else video.play().catch(() => {});
  });
}

reducedMotionQuery.addEventListener('change', () => {
  syncAmbientVideoMotion();
  updateScrollState();
});
syncAmbientVideoMotion();

if (archiveDialog) {
  const archiveImage = archiveDialog.querySelector('.archive-image');
  const archiveTitle = archiveDialog.querySelector('#archive-title');
  const archiveKind = archiveDialog.querySelector('.archive-kind');
  const archiveNote = archiveDialog.querySelector('.archive-note');
  const archiveSpecs = archiveDialog.querySelector('.archive-specs');
  const closeArchive = archiveDialog.querySelector('.archive-close');
  let archiveTrigger = null;

  archiveTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      archiveTrigger = trigger;
      archiveTitle.textContent = trigger.dataset.title;
      archiveKind.textContent = trigger.dataset.kind;
      archiveNote.textContent = trigger.dataset.note;
      archiveSpecs.replaceChildren();
      const typeRow = document.createElement('div');
      const typeLabel = document.createElement('dt');
      const typeValue = document.createElement('dd');
      typeLabel.textContent = 'TYPE';
      typeValue.textContent = trigger.dataset.kind;
      typeRow.append(typeLabel, typeValue);
      archiveSpecs.append(typeRow);
      (trigger.dataset.specs || '').split(';').filter(Boolean).forEach((spec) => {
        const [label, value] = spec.split('|');
        if (!label || !value) return;
        const row = document.createElement('div');
        const term = document.createElement('dt');
        const description = document.createElement('dd');
        term.textContent = label;
        description.textContent = value;
        row.append(term, description);
        archiveSpecs.append(row);
      });
      archiveImage.src = trigger.dataset.image;
      archiveImage.alt = `${trigger.dataset.kind} 제품 이미지`;
      archiveDialog.showModal();
      closeArchive.focus();
    });
  });

  closeArchive.addEventListener('click', () => archiveDialog.close());
  archiveDialog.addEventListener('click', (event) => {
    if (event.target === archiveDialog) archiveDialog.close();
  });
  archiveDialog.addEventListener('close', () => {
    archiveTrigger?.focus();
    archiveTrigger = null;
  });
}

document.documentElement.classList.add('js-enhanced');
window.requestAnimationFrame(() => document.documentElement.classList.add('is-loaded'));
pageSections.forEach((section) => {
  [...section.children].forEach((item, index) => item.style.setProperty('--item-index', String(index)));
});

function updatePageProgress() {
  const scrollableDistance = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  document.documentElement.style.setProperty('--page-progress', String(Math.min(1, window.scrollY / scrollableDistance)));
}

let scrollFrame = 0;
let chapterRailTimer = 0;
function requestScrollUpdate() {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(() => {
    updateScrollState();
    updatePageProgress();
    scrollFrame = 0;
  });
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('is-inview');
  });
}, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
pageSections.forEach((section) => revealObserver.observe(section));

const stageObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => entry.target.classList.toggle('is-stage-active', entry.isIntersecting));
}, { rootMargin: '-24% 0px -24% 0px', threshold: 0.08 });
document.querySelectorAll('.object-detail').forEach((chapter) => stageObserver.observe(chapter));

const chapterObserver = new IntersectionObserver((entries) => {
  const active = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!active) return;
  chapterLinks.forEach((link) => {
    const isCurrent = link.dataset.chapterLink === active.target.id;
    link.classList.toggle('is-current', isCurrent);
    if (isCurrent) link.setAttribute('aria-current', 'step');
    else link.removeAttribute('aria-current');
  });
}, { rootMargin: '-44% 0px -44% 0px', threshold: [0.02, 0.4, 0.8] });
chapterTargets.forEach((target) => chapterObserver.observe(target));

window.addEventListener('scroll', () => {
  document.documentElement.classList.add('is-scrolling');
  window.clearTimeout(chapterRailTimer);
  chapterRailTimer = window.setTimeout(() => document.documentElement.classList.remove('is-scrolling'), 520);
  requestScrollUpdate();
}, { passive: true });
window.addEventListener('resize', requestScrollUpdate, { passive: true });
requestScrollUpdate();

const trackedSections = document.querySelectorAll('#moray, #objects, #contact');
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => link.toggleAttribute('aria-current', link.getAttribute('href') === `#${entry.target.id}`));
  });
}, { rootMargin: '-45% 0px -45% 0px' });
trackedSections.forEach((section) => sectionObserver.observe(section));

const inquiryForm = document.querySelector('#inquiry-form');
const inquiryStatus = document.querySelector('#inquiry-status');
if (inquiryForm) {
  inquiryForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!inquiryForm.checkValidity()) {
      inquiryForm.reportValidity();
      return;
    }
    const values = new FormData(inquiryForm);
    const name = values.get('name') || 'OSSIUM visitor';
    const body = [
      `Name: ${name}`,
      `Email: ${values.get('email') || ''}`,
      `Phone: ${values.get('phone') || ''}`,
      `Country / City: ${values.get('location') || ''}`,
      '',
      'Message:',
      values.get('message') || '',
    ].join('\n');
    const recipient = 'zjsxmfhf2rl@gmail.com';
    const subject = `[OSSIUM Inquiry] ${name}`;
    inquiryStatus.textContent = '이메일 작성 창을 엽니다.';
    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

// Product imagery responds to a precise pointer without making touch interactions dependent on hover.
const reactiveMedia = document.querySelectorAll('.hero-product, .structure-media, .intro-image, .motion-media, .material-image, .anatomy-media, .detail-image, .object-card');
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  reactiveMedia.forEach((media) => {
    media.classList.add('media-reactive');
    media.addEventListener('pointerenter', () => media.classList.add('is-pointer-active'));
    media.addEventListener('pointerleave', () => {
      media.classList.remove('is-pointer-active');
      media.style.removeProperty('--pointer-x');
      media.style.removeProperty('--pointer-y');
    });
    media.addEventListener('pointermove', (event) => {
      const bounds = media.getBoundingClientRect();
      media.style.setProperty('--pointer-x', `${((event.clientX - bounds.left) / bounds.width * 100).toFixed(1)}%`);
      media.style.setProperty('--pointer-y', `${((event.clientY - bounds.top) / bounds.height * 100).toFixed(1)}%`);
    });
  });
}
