document.addEventListener('DOMContentLoaded', () => {
  // Manga images list (referencing public/assets/manga paths)
  const pages = [
    '/assets/manga/manga1.png',
    '/assets/manga/manga2.jpg',
    '/assets/manga/manga3.png',
    '/assets/manga/manga4.png',
    '/assets/manga/manga5.png',
    '/assets/manga/manga6.png',
    '/assets/manga/manga7.png',
    '/assets/manga/manga8.png',
    '/assets/manga/manga9.png'
  ];

  let currentPageIndex = 0;
  let currentMode = 'scroll'; // 'scroll' or 'flip'

  // DOM Elements
  const modeScrollBtn = document.getElementById('mode-scroll');
  const modeFlipBtn = document.getElementById('mode-flip');
  const scrollWrapper = document.getElementById('scroll-wrapper');
  const flipWrapper = document.getElementById('flip-wrapper');
  const flipImg = document.getElementById('flip-img');
  
  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');
  
  const pageSlider = document.getElementById('page-slider');
  const pageIndicator = document.getElementById('page-indicator');
  const flipProgressSection = document.getElementById('flip-progress-section');
  const readerContainer = document.getElementById('reader-container');

  // --- Initialize Scroll View ---
  function initScrollView() {
    scrollWrapper.innerHTML = '';
    pages.forEach((src, index) => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = `Manga Page ${index + 1}`;
      img.loading = 'lazy';
      scrollWrapper.appendChild(img);
    });
  }

  // --- Initialize Flip View ---
  function updateFlipPage() {
    flipImg.style.opacity = '0';
    setTimeout(() => {
      flipImg.src = pages[currentPageIndex];
      flipImg.alt = `Manga Page ${currentPageIndex + 1}`;
      flipImg.style.opacity = '1';
    }, 150);

    // Update controls
    pageSlider.value = currentPageIndex + 1;
    pageIndicator.textContent = `${currentPageIndex + 1} / ${pages.length}`;
  }

  // View Mode Switchers
  modeScrollBtn.addEventListener('click', () => {
    currentMode = 'scroll';
    modeScrollBtn.classList.add('active');
    modeFlipBtn.classList.remove('active');
    scrollWrapper.classList.add('active');
    flipWrapper.classList.remove('active');
    flipProgressSection.style.display = 'none';
  });

  modeFlipBtn.addEventListener('click', () => {
    currentMode = 'flip';
    modeFlipBtn.classList.add('active');
    modeScrollBtn.classList.remove('active');
    flipWrapper.classList.add('active');
    scrollWrapper.classList.remove('active');
    flipProgressSection.style.display = 'block';
    updateFlipPage();
  });

  // Flip Page Navigation
  function nextPage() {
    if (currentPageIndex < pages.length - 1) {
      currentPageIndex++;
      updateFlipPage();
    }
  }

  function prevPage() {
    if (currentPageIndex > 0) {
      currentPageIndex--;
      updateFlipPage();
    }
  }

  nextBtn.addEventListener('click', nextPage);
  prevBtn.addEventListener('click', prevPage);

  // Slider change
  pageSlider.addEventListener('input', (e) => {
    currentPageIndex = parseInt(e.target.value) - 1;
    updateFlipPage();
  });

  // Keyboard navigation support
  document.addEventListener('keydown', (e) => {
    if (currentMode === 'flip') {
      if (e.key === 'ArrowRight') {
        nextPage();
      } else if (e.key === 'ArrowLeft') {
        prevPage();
      }
    }
  });

  // --- Visual Filter Selection ---
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const filter = btn.dataset.filter;
      // Remove previous filters
      readerContainer.classList.remove('sepia', 'ink', 'darkroom');
      
      if (filter !== 'normal') {
        readerContainer.classList.add(filter);
      }
    });
  });

  // --- Character Drawer Trigger ---
  const charDrawerBtn = document.getElementById('char-drawer-btn');
  const charDrawerOverlay = document.getElementById('char-drawer-overlay');
  const closeDrawerBtn = document.getElementById('close-drawer');

  charDrawerBtn.addEventListener('click', () => {
    charDrawerOverlay.classList.add('active');
  });

  closeDrawerBtn.addEventListener('click', () => {
    charDrawerOverlay.classList.remove('active');
  });

  charDrawerOverlay.addEventListener('click', (e) => {
    if (e.target === charDrawerOverlay) {
      charDrawerOverlay.classList.remove('active');
    }
  });

  // Boot up Scroll View
  initScrollView();
});
