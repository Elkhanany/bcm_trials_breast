const fs = require('fs');
const { Transformer } = require('markmap-lib');

// Replace this with your Markdown file path
const markdownPath = './landscape.md';
// Replace this with your desired output HTML file path
const outputPath = './index.html';

// Read Markdown file
const markdown = fs.readFileSync(markdownPath, 'utf-8');

// Transform Markdown to Markmap data
const transformer = new Transformer();
const { root, features } = transformer.transform(markdown);

// Get assets
const assets = transformer.getUsedAssets(features);

// Define JSON options
const jsonOptions = {
  initialExpandLevel: 4,
  maxWidth: 250,
  duration: 400,
  spacingVertical: 8,
  spacingHorizontal: 100,
  autoFit: true
};

// Get current date for "last updated"
const lastUpdated = new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

// Count trials from markdown directly (more accurate)
// Bold (**name**) = OPEN, non-bold with brackets = other status
const trialMatches = markdown.match(/^        - .+$/gm) || [];
let openCount = 0;
let totalCount = 0;

trialMatches.forEach(line => {
  // Skip eligibility criteria lines (contain [x])
  if (line.includes('[x]')) return;

  // This is a trial line
  totalCount++;

  // Bold = OPEN
  if (line.includes('**')) {
    openCount++;
  }
});

// Generate HTML
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="ie=edge">
<title>BCM Breast Cancer Trials</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/markmap-toolbar@0.17.0/dist/style.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
<style>
:root {
  --bg-gradient-start: #f8fafc;
  --bg-gradient-end: #e2e8f0;
  --header-bg: rgba(255, 255, 255, 0.95);
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --accent: #3b82f6;
  --accent-hover: #2563eb;
  --border: #e2e8f0;
  --shadow: rgba(0, 0, 0, 0.1);
  --status-open: #10b981;
  --status-opening: #f59e0b;
  --status-closing: #f97316;
  --status-closed: #ef4444;
  --card-bg: rgba(255, 255, 255, 0.9);
  --node-text: #1e293b;
}

[data-theme="dark"] {
  --bg-gradient-start: #0f172a;
  --bg-gradient-end: #1e293b;
  --header-bg: rgba(15, 23, 42, 0.95);
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --accent: #60a5fa;
  --accent-hover: #3b82f6;
  --border: #334155;
  --shadow: rgba(0, 0, 0, 0.3);
  --card-bg: rgba(30, 41, 59, 0.9);
  --node-text: #f1f5f9;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Nunito', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%);
  min-height: 100vh;
  color: var(--text-primary);
  transition: background 0.3s ease, color 0.3s ease;
}

/* Header */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: var(--header-bg);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 1000;
  box-shadow: 0 1px 3px var(--shadow);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
  font-size: 18px;
}

.title-section h1 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.title-section .subtitle {
  font-size: 12px;
  color: var(--text-secondary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Search */
.search-container {
  position: relative;
}

.search-input {
  width: 280px;
  padding: 10px 16px 10px 40px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--card-bg);
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-input::placeholder {
  color: var(--text-secondary);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  pointer-events: none;
}

.search-results {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: var(--card-bg);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border);
  border-radius: 12px;
  max-height: 320px;
  overflow-y: auto;
  display: none;
  box-shadow: 0 10px 40px var(--shadow);
}

.search-results.active {
  display: block;
}

.search-result-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
  transition: background 0.15s ease;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background: var(--accent);
  color: white;
}

.search-result-item .trial-name {
  font-weight: 500;
  font-size: 14px;
}

.search-result-item .trial-path {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 2px;
}

/* Theme Toggle */
.theme-toggle {
  width: 44px;
  height: 44px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--card-bg);
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.theme-toggle:hover {
  border-color: var(--accent);
  color: var(--accent);
}

/* Legend */
.legend {
  position: fixed;
  bottom: 24px;
  left: 24px;
  background: var(--card-bg);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  z-index: 100;
  box-shadow: 0 4px 20px var(--shadow);
  min-width: 180px;
}

.legend h3 {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  font-size: 13px;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-dot.open { background: var(--status-open); }
.legend-dot.opening { background: var(--status-opening); }
.legend-dot.closing { background: var(--status-closing); }
.legend-dot.closed { background: var(--status-closed); }

.legend-text {
  color: var(--text-primary);
}

.legend-text span {
  color: var(--text-secondary);
  font-size: 11px;
}

/* Stats */
.stats {
  position: fixed;
  top: 80px;
  right: 24px;
  display: flex;
  gap: 12px;
  z-index: 100;
}

.stat-card {
  background: var(--card-bg);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 16px;
  text-align: center;
  min-width: 80px;
  box-shadow: 0 4px 12px var(--shadow);
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: var(--accent);
}

.stat-label {
  font-size: 11px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
}

/* Mindmap */
#mindmap {
  display: block;
  width: 100vw;
  height: calc(100vh - 64px);
  margin-top: 64px;
}

/* Custom node styles */
#mindmap .markmap-node {
  transition: opacity 0.3s ease;
}

#mindmap .markmap-node.dimmed {
  opacity: 0.2;
}

#mindmap .markmap-node-circle {
  transition: r 0.2s ease, fill 0.2s ease;
}

#mindmap .markmap-node:hover .markmap-node-circle {
  r: 6;
}

/* SVG text styling - IMPORTANT for dark mode */
#mindmap .markmap-node text {
  font-family: 'Nunito', Tahoma, Geneva, Verdana, sans-serif !important;
  fill: var(--node-text) !important;
  transition: fill 0.3s ease;
}

/* Override for status colors - applied via JS */
#mindmap .markmap-node text.status-opening {
  fill: var(--status-opening) !important;
}

#mindmap .markmap-node text.status-closing {
  fill: var(--status-closing) !important;
}

#mindmap .markmap-node text.status-closed {
  fill: var(--status-closed) !important;
  opacity: 0.6;
}

/* Toolbar override */
.mm-toolbar {
  background: var(--card-bg) !important;
  backdrop-filter: blur(12px);
  border: 1px solid var(--border) !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 20px var(--shadow) !important;
}

.mm-toolbar-brand {
  display: none !important;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.header, .legend, .stats {
  animation: fadeIn 0.4s ease;
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .search-input {
    width: 200px;
  }

  .stats {
    display: none;
  }

  .legend {
    bottom: auto;
    top: 80px;
    left: 12px;
    transform: scale(0.9);
    transform-origin: top left;
  }
}
</style>
</head>
<body>

<!-- Header -->
<header class="header">
  <div class="header-left">
    <div class="logo">BC</div>
    <div class="title-section">
      <h1>BCM Breast Cancer Trials</h1>
      <div class="subtitle">Last updated: ${lastUpdated}</div>
    </div>
  </div>
  <div class="header-right">
    <div class="search-container">
      <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
      <input type="text" class="search-input" placeholder="Search trials..." id="searchInput">
      <div class="search-results" id="searchResults"></div>
    </div>
    <button class="theme-toggle" id="themeToggle" title="Toggle dark mode">
      <svg class="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"></circle>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
      </svg>
    </button>
  </div>
</header>

<!-- Legend -->
<div class="legend">
  <h3>Trial Status</h3>
  <div class="legend-item">
    <div class="legend-dot open"></div>
    <div class="legend-text"><strong>Bold</strong> <span>= Open</span></div>
  </div>
  <div class="legend-item">
    <div class="legend-dot opening"></div>
    <div class="legend-text">[OPENING] <span>= Coming Soon</span></div>
  </div>
  <div class="legend-item">
    <div class="legend-dot closing"></div>
    <div class="legend-text">[CLOSING] <span>= Closing Soon</span></div>
  </div>
  <div class="legend-item">
    <div class="legend-dot closed"></div>
    <div class="legend-text">[CLOSED] <span>= Closed</span></div>
  </div>
</div>

<!-- Stats (pre-calculated) -->
<div class="stats">
  <div class="stat-card">
    <div class="stat-number">${openCount}</div>
    <div class="stat-label">Open</div>
  </div>
  <div class="stat-card">
    <div class="stat-number">${totalCount}</div>
    <div class="stat-label">Total</div>
  </div>
</div>

<!-- Mindmap -->
<svg id="mindmap"></svg>

<script src="https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/markmap-view@0.17.0/dist/browser/index.js"></script>
<script src="https://cdn.jsdelivr.net/npm/markmap-toolbar@0.17.0/dist/index.js"></script>
<script>
// Theme toggle
const themeToggle = document.getElementById('themeToggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const savedTheme = localStorage.getItem('theme');

if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
  document.documentElement.setAttribute('data-theme', 'dark');
}

themeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
  // Re-apply styles after theme change
  startStyleUpdater();
});

// Markmap initialization
const root = ${JSON.stringify(root)};
const jsonOptions = ${JSON.stringify(jsonOptions)};

// Build search index from tree
const searchIndex = [];

function traverseTree(node, path = []) {
  const content = node.content || node.v || '';
  const currentPath = [...path, content];

  // Check if this is a trial node (bold or has status brackets, but not [x] criteria)
  const isTrialNode = (content.includes('<strong>') ||
                       content.includes('[OPENING') ||
                       content.includes('[CLOSING') ||
                       content.includes('[CLOSED')) &&
                      !content.includes('[x]');

  if (isTrialNode) {
    // Clean up name for search
    const cleanName = content
      .replace(/<[^>]*>/g, '')  // Remove HTML tags
      .replace(/\\[.*?\\]/g, '')  // Remove brackets
      .trim();

    searchIndex.push({
      name: cleanName,
      path: path.filter(p => !p.includes('[x]')).join(' > '),
      node: node
    });
  }

  if (node.children) {
    node.children.forEach(child => traverseTree(child, currentPath));
  }
}

traverseTree(root);

// Search functionality
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

searchInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();

  if (query.length < 2) {
    searchResults.classList.remove('active');
    document.querySelectorAll('.markmap-node').forEach(n => n.classList.remove('dimmed'));
    return;
  }

  const matches = searchIndex.filter(item =>
    item.name.toLowerCase().includes(query) ||
    item.path.toLowerCase().includes(query)
  ).slice(0, 10);

  if (matches.length > 0) {
    searchResults.innerHTML = matches.map(m => \`
      <div class="search-result-item" data-name="\${m.name}">
        <div class="trial-name">\${m.name}</div>
        <div class="trial-path">\${m.path}</div>
      </div>
    \`).join('');
    searchResults.classList.add('active');

    // Dim non-matching nodes
    const matchNames = new Set(matches.map(m => m.name.toLowerCase()));
    document.querySelectorAll('.markmap-node').forEach(node => {
      const text = node.textContent.toLowerCase();
      const hasMatch = Array.from(matchNames).some(name => text.includes(name));
      node.classList.toggle('dimmed', !hasMatch);
    });
  } else {
    searchResults.innerHTML = '<div class="search-result-item"><div class="trial-name">No results found</div></div>';
    searchResults.classList.add('active');
  }
});

searchInput.addEventListener('blur', () => {
  setTimeout(() => {
    searchResults.classList.remove('active');
  }, 200);
});

searchResults.addEventListener('click', (e) => {
  const item = e.target.closest('.search-result-item');
  if (item) {
    searchInput.value = item.dataset.name;
    searchResults.classList.remove('active');
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    searchInput.value = '';
    searchResults.classList.remove('active');
    document.querySelectorAll('.markmap-node').forEach(n => n.classList.remove('dimmed'));
  }
});

// WebFont loading
window.WebFontConfig = {
  custom: {
    families: [
      "KaTeX_AMS","KaTeX_Caligraphic:n4,n7","KaTeX_Fraktur:n4,n7",
      "KaTeX_Main:n4,n7,i4,i7","KaTeX_Math:i4,i7","KaTeX_Script",
      "KaTeX_SansSerif:n4,n7,i4","KaTeX_Size1","KaTeX_Size2",
      "KaTeX_Size3","KaTeX_Size4","KaTeX_Typewriter"
    ],
    active: function() {
      window.markmap.refreshHook.call();
    }
  }
};

// Create dynamic stylesheet for theme-based colors
// This injects CSS that uses !important to override ALL markmap styles
function injectThemeStyles() {
  // Remove old dynamic styles
  const oldStyle = document.getElementById('dynamic-theme-styles');
  if (oldStyle) oldStyle.remove();

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#f1f5f9' : '#1e293b';

  const css = \`
    /* Force text color on ALL possible markmap elements */
    #mindmap text,
    #mindmap tspan,
    #mindmap foreignObject,
    #mindmap foreignObject *,
    #mindmap .markmap-node text,
    #mindmap .markmap-node tspan,
    #mindmap .markmap-foreign-object,
    #mindmap .markmap-foreign-object *,
    #mindmap [class*="markmap"] text,
    #mindmap [class*="markmap"] tspan,
    #mindmap g text,
    #mindmap g tspan,
    .markmap text,
    .markmap tspan,
    svg text,
    svg tspan {
      fill: \${textColor} !important;
      color: \${textColor} !important;
      font-family: 'Nunito', Tahoma, Geneva, Verdana, sans-serif !important;
    }

    /* Status colors - these should still work */
    #mindmap text:has-text("[CLOSED"),
    #mindmap foreignObject:has-text("[CLOSED") * {
      fill: #ef4444 !important;
      color: #ef4444 !important;
      opacity: 0.6 !important;
    }
  \`;

  const style = document.createElement('style');
  style.id = 'dynamic-theme-styles';
  style.textContent = css;
  document.head.appendChild(style);

  // Directly modify ALL elements in the SVG
  setTimeout(() => {
    const svg = document.getElementById('mindmap');
    if (!svg) return;

    // Get ALL text-containing elements
    const allElements = svg.querySelectorAll('*');
    console.log('Found ' + allElements.length + ' elements in mindmap');

    allElements.forEach(el => {
      const tagName = el.tagName.toLowerCase();

      // For text and tspan elements (SVG text)
      if (tagName === 'text' || tagName === 'tspan') {
        el.setAttribute('fill', textColor);
        el.setAttribute('style', 'fill: ' + textColor + ' !important; font-family: Nunito, Tahoma, sans-serif !important;');
      }

      // For foreignObject content (HTML inside SVG)
      if (tagName === 'div' || tagName === 'span' || tagName === 'strong' || tagName === 'p') {
        el.setAttribute('style', 'color: ' + textColor + ' !important; font-family: Nunito, Tahoma, sans-serif !important;');
      }

      // For foreignObject itself
      if (tagName === 'foreignobject') {
        el.querySelectorAll('*').forEach(child => {
          child.setAttribute('style', 'color: ' + textColor + ' !important; font-family: Nunito, Tahoma, sans-serif !important;');
        });
      }
    });
  }, 200);
}

// Run repeatedly to catch Markmap re-renders
let styleInterval;
function startStyleUpdater() {
  // Clear any existing interval
  if (styleInterval) clearInterval(styleInterval);

  // Inject styles immediately
  injectThemeStyles();

  // Re-apply every 500ms for 5 seconds to catch async renders
  let count = 0;
  styleInterval = setInterval(() => {
    injectThemeStyles();
    count++;
    if (count >= 10) clearInterval(styleInterval);
  }, 500);
}

// Initialize markmap
(() => {
  setTimeout(() => {
    const { markmap: Markmap, mm: markmapInstance } = window;
    const toolbar = new Markmap.Toolbar();
    toolbar.attach(markmapInstance);
    const toolbarElement = toolbar.render();
    toolbarElement.style.position = 'absolute';
    toolbarElement.style.bottom = '24px';
    toolbarElement.style.right = '24px';
    document.body.append(toolbarElement);

    // Apply styles (font, colors)
    startStyleUpdater();

    // Re-apply on any markmap updates
    const observer = new MutationObserver(() => {
      applyNodeStyles();
    });
    observer.observe(document.getElementById('mindmap'), {
      childList: true,
      subtree: true
    });
  });

  ((getMarkmap, getOptions, root, jsonOptions) => {
    const markmap = getMarkmap();
    window.mm = markmap.Markmap.create(
      "svg#mindmap",
      (getOptions || markmap.deriveOptions)(jsonOptions),
      root
    );
  })(() => window.markmap, null, root, jsonOptions);
})();
</script>
<script src="https://cdn.jsdelivr.net/npm/webfontloader@1.6.28/webfontloader.js" defer></script>
</body>
</html>
`;

// Write HTML to file
fs.writeFileSync(outputPath, htmlContent);

console.log('Interactive Markmap HTML generated:', outputPath);
console.log('Stats: ' + openCount + ' open / ' + totalCount + ' total trials');
