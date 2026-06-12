const menuButtons = Array.from(document.querySelectorAll(".menu-button"));
const siteScriptUrl = document.currentScript?.src || window.location.href;

function getContributorHref() {
  const path = window.location.pathname;

  if (path.includes("/cards/")) {
    return "../../pages/contributor.html";
  }

  if (path.endsWith("/") || path.endsWith("/index.html")) {
    return "pages/contributor.html";
  }

  return "contributor.html";
}

function createHeaderUserButton() {
  const button = document.createElement("a");

  button.className = "header-user-button";
  button.href = getContributorHref();
  button.setAttribute("aria-label", "User");
  button.setAttribute("data-tooltip", "User");
  button.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4"></circle>
      <path d="M4 21a8 8 0 0 1 16 0"></path>
    </svg>
  `;
  return button;
}

function initHeaderUserButtons() {
  document.querySelectorAll(".site-header").forEach((header) => {
    if (header.querySelector(".header-user-button")) {
      return;
    }

    const oldSubmit = header.querySelector(".header-submit-button[data-submit-modal-trigger]");
    const userButton = createHeaderUserButton();

    if (oldSubmit) {
      oldSubmit.replaceWith(userButton);
      return;
    }

    header.append(userButton);
  });
}

function closeMenu(header, button) {
  header.classList.remove("is-menu-open");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-label", "Open navigation");
}

menuButtons.forEach((button) => {
  const header = button.closest(".site-header");
  const menuLinks = Array.from(header?.querySelectorAll(".main-nav a") || []);

  if (!header) {
    return;
  }

  button.setAttribute("aria-expanded", "false");

  button.addEventListener("click", () => {
    const isOpen = header.classList.toggle("is-menu-open");

    button.setAttribute("aria-expanded", String(isOpen));
    button.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });

  menuLinks.forEach((link) => {
    link.addEventListener("click", () => closeMenu(header, button));
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  menuButtons.forEach((button) => {
    const header = button.closest(".site-header");

    if (header) {
      closeMenu(header, button);
    }
  });
});

const tabs = Array.from(document.querySelectorAll("[data-tab-target]"));
const panels = Array.from(document.querySelectorAll(".resource-panel"));
const tabModeQuery = window.matchMedia("(max-width: 1024px)");

function setActiveTab(targetId) {
  tabs.forEach((item) => {
    const isActive = item.dataset.tabTarget === targetId;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-selected", String(isActive));
  });
}

function syncPanels() {
  if (!tabs.length || !panels.length) {
    return;
  }

  if (tabModeQuery.matches) {
    const activeTab = tabs.find((tab) => tab.classList.contains("is-active")) || tabs[0];
    const targetId = activeTab.dataset.tabTarget;

    panels.forEach((panel) => {
      panel.hidden = panel.id !== targetId;
    });
    setActiveTab(targetId);
    return;
  }

  panels.forEach((panel) => {
    panel.hidden = false;
  });
  const activeTab = tabs.find((tab) => tab.classList.contains("is-active")) || tabs[0];
  setActiveTab(activeTab.dataset.tabTarget);
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const targetId = tab.dataset.tabTarget;

    if (!tabModeQuery.matches) {
      setActiveTab(targetId);
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setActiveTab(targetId);
    panels.forEach((panel) => {
      panel.hidden = panel.id !== targetId;
    });
  });
});

tabModeQuery.addEventListener("change", syncPanels);
syncPanels();

initHeaderUserButtons();

const submitModalTriggers = Array.from(document.querySelectorAll("[data-submit-modal-trigger]"));
const submitIssueUrl = "https://github.com/homayounrezaie/GeoMind/issues/new";
const submitModalConfig = {
  paper: {
    title: "Submit a paper",
    description: "Add a GitHub repository link or a paper URL that belongs in GeoMind.",
    label: "GitHub link or paper URL",
    placeholder: "https://arxiv.org/abs/2501.12345 · https://github.com/org/repo",
    hint: "Paste a full GitHub link or paper URL, such as arXiv or a publisher page.",
    action: "Submit paper",
    resourceType: "paper",
    issueTitle: "Submit paper",
    bodyLabel: "GitHub link or paper URL",
    emptyMessage: "Enter a GitHub link or paper URL.",
    invalidMessage: "Enter a full link starting with http:// or https://.",
  },
  dataset: {
    title: "Submit a dataset",
    description: "Add a dataset or benchmark link that belongs in GeoMind.",
    label: "Dataset or benchmark link",
    placeholder: "https://huggingface.co/datasets/org/data · https://github.com/org/dataset",
    hint: "Paste a full dataset or benchmark link, such as Hugging Face, GitHub, or a project page.",
    action: "Submit dataset",
    resourceType: "dataset or benchmark",
    issueTitle: "Submit dataset",
    bodyLabel: "Dataset or benchmark link",
    emptyMessage: "Enter a dataset or benchmark link.",
    invalidMessage: "Enter a full link starting with http:// or https://.",
  },
  model: {
    title: "Submit a model",
    description: "Add a model, checkpoint, demo, or model release link that belongs in GeoMind.",
    label: "Model link",
    placeholder: "https://github.com/org/model · https://huggingface.co/org/model",
    hint: "Paste a full model link, such as GitHub, Hugging Face, or another project page.",
    action: "Submit model",
    resourceType: "model",
    issueTitle: "Submit model",
    bodyLabel: "Model link",
    emptyMessage: "Enter a model link.",
    invalidMessage: "Enter a full link starting with http:// or https://.",
  },
};

function createSubmitModal() {
  const modal = document.createElement("div");

  modal.className = "submit-modal";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="submit-modal-panel" role="dialog" aria-modal="true" aria-labelledby="submit-modal-title" aria-describedby="submit-modal-description">
      <button class="submit-modal-close" type="button" aria-label="Close submit dialog" data-submit-modal-close></button>
      <h2 id="submit-modal-title"></h2>
      <p id="submit-modal-description" class="submit-modal-description"></p>
      <form class="submit-modal-form" novalidate>
        <label for="submit-modal-input"></label>
        <input id="submit-modal-input" type="url" autocomplete="url" />
        <p class="submit-modal-hint"></p>
        <p class="submit-modal-error" role="alert" hidden></p>
        <div class="submit-modal-actions">
          <button class="submit-modal-primary" type="submit"></button>
          <button class="submit-modal-secondary" type="button" data-submit-modal-cancel>Cancel</button>
        </div>
      </form>
    </div>
  `;

  document.body.append(modal);
  return modal;
}

function initSubmitModal() {
  if (!submitModalTriggers.length) {
    return;
  }

  const modal = createSubmitModal();
  const panel = modal.querySelector(".submit-modal-panel");
  const title = modal.querySelector("#submit-modal-title");
  const description = modal.querySelector("#submit-modal-description");
  const form = modal.querySelector(".submit-modal-form");
  const label = modal.querySelector("label");
  const input = modal.querySelector("#submit-modal-input");
  const hint = modal.querySelector(".submit-modal-hint");
  const error = modal.querySelector(".submit-modal-error");
  const primary = modal.querySelector(".submit-modal-primary");
  const closeButtons = Array.from(
    modal.querySelectorAll("[data-submit-modal-close], [data-submit-modal-cancel]")
  );
  let activeConfig = submitModalConfig.paper;
  let previousFocus = null;

  function setModalContent(config) {
    title.textContent = config.title;
    description.textContent = config.description;
    label.textContent = config.label;
    input.placeholder = config.placeholder;
    hint.textContent = config.hint;
    primary.textContent = config.action;
    error.textContent = "";
    error.hidden = true;
    input.value = "";
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("is-submit-modal-open");
    previousFocus?.focus();
    previousFocus = null;
  }

  function openModal(kind, trigger) {
    activeConfig = submitModalConfig[kind] || submitModalConfig.paper;
    previousFocus = trigger || document.activeElement;
    setModalContent(activeConfig);
    modal.hidden = false;
    document.body.classList.add("is-submit-modal-open");
    window.setTimeout(() => input.focus(), 0);
  }

  function getIssueUrl(value) {
    const issueUrl = new URL(submitIssueUrl);
    const source = window.location.href;
    const issueTitle = `${activeConfig.issueTitle}: ${value}`.slice(0, 180);
    const issueBody = [
      `Resource type: ${activeConfig.resourceType}`,
      "",
      `${activeConfig.bodyLabel}:`,
      value,
      "",
      "Submitted from:",
      source,
    ].join("\n");

    issueUrl.searchParams.set("title", issueTitle);
    issueUrl.searchParams.set("body", issueBody);
    return issueUrl.toString();
  }

  function isValidSubmitLink(value) {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  submitModalTriggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openModal(trigger.dataset.submitKind || "paper", trigger);
    });
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  form.addEventListener("submit", (event) => {
    const value = input.value.trim();

    event.preventDefault();

    if (!value) {
      error.textContent = activeConfig.emptyMessage;
      error.hidden = false;
      input.focus();
      return;
    }

    if (!isValidSubmitLink(value)) {
      error.textContent = activeConfig.invalidMessage;
      error.hidden = false;
      input.focus();
      return;
    }

    window.open(getIssueUrl(value), "_blank", "noopener");
    closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (modal.hidden) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusable = Array.from(
      panel.querySelectorAll("button, input, select, textarea, a[href], [tabindex]:not([tabindex='-1'])")
    ).filter((item) => !item.disabled && item.offsetParent !== null);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (!first || !last) {
      return;
    }

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

initSubmitModal();

function getRowYear(row) {
  const visibleYear = Array.from(row.cells)
    .map((cell) => cell.textContent.trim())
    .find((text) => /^(19|20)\d{2}$/.test(text));

  if (visibleYear) {
    return Number(visibleYear);
  }

  const explicitYear = Number(row.dataset.year);

  if (Number.isFinite(explicitYear) && explicitYear > 0) {
    return explicitYear;
  }

  const match = row.textContent.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : 0;
}

function getRowCompanyKeys(row) {
  const text = [
    row.textContent,
    ...Array.from(row.querySelectorAll("a")).map((link) => link.href),
  ]
    .join(" ")
    .toLowerCase();
  const checks = {
    google: [/\bgoogle\b/, /deepmind/, /alphaearth/],
    meta: [/\bmeta ai\b/, /facebookresearch/, /segment-anything/],
    microsoft: [/\bmicrosoft\b/, /msr-?ai/, /ai4science/],
    nvidia: [/\bnvidia\b/],
    ibm: [/\bibm\b/, /ibm-nasa-geospatial/, /prithvi/, /terramind/, /terratorch/],
    amazon: [/\bamazon\b/, /\baws\b/],
    "allen-ai": [/\ballen ai\b/, /allenai/, /satlas/, /olmoearth/],
    nasa: [/\bnasa\b/, /ibm-nasa-geospatial/, /prithvi/],
    esa: [/\besa\b/, /esa-philab/, /phileo/],
  };

  return Object.entries(checks)
    .filter(([, patterns]) => patterns.some((pattern) => pattern.test(text)))
    .map(([key]) => key);
}

function getSourceKind(link) {
  try {
    const host = new URL(link.href, window.location.href).hostname.replace(/^www\./, "");

    if (host === "github.com") {
      return { label: "GitHub", type: "github" };
    }

    if (host === "huggingface.co") {
      return { label: "Hugging Face", type: "huggingface" };
    }

    if (host === "arxiv.org") {
      return { label: "arXiv", type: "arxiv" };
    }

  } catch {
    return null;
  }

  return null;
}

function getCardLinkLabel(searchInput) {
  const itemLabel = searchInput?.placeholder?.replace(/^Search\s+/i, "").trim().toLowerCase();
  const singularLabels = {
    benchmarks: "benchmark",
    datasets: "dataset",
    models: "model",
    papers: "paper",
    "papers with code": "paper",
  };

  return `View ${singularLabels[itemLabel] || "resource"} card`;
}

function decorateSourceLink(link, cardLinkLabel, showSourceIcons) {
  const isDatasetCard = cardLinkLabel === "View dataset card";
  const source = isDatasetCard ? null : getSourceKind(link);
  const icon = document.createElement("span");
  const text = document.createElement("span");

  link.classList.add("source-link");
  link.textContent = "";
  text.textContent = cardLinkLabel;

  if (source && showSourceIcons) {
    icon.className = `source-icon source-icon-${source.type}`;
    icon.setAttribute("aria-hidden", "true");
    link.setAttribute("aria-label", `${cardLinkLabel} on ${source.label}`);
    link.append(icon);
  }

  link.append(text);
}

function decorateSourceLinks(table, cardLinkLabel) {
  const showSourceIcons = table?.dataset.sourceIcons !== "false";

  table?.querySelectorAll("tbody td:last-child a").forEach((link) => {
    decorateSourceLink(link, cardLinkLabel, showSourceIcons);
  });
}

function hasResourceValue(value) {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim() !== "";
  }

  if (Array.isArray(value)) {
    return value.some(hasResourceValue);
  }

  if (typeof value === "object") {
    return Object.values(value).some(hasResourceValue);
  }

  return true;
}

const savedResourcesStorageKey = "geomind:saved-resources";

function getSavedResources() {
  try {
    const saved = JSON.parse(localStorage.getItem(savedResourcesStorageKey) || "{}");

    return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  } catch {
    return {};
  }
}

function setSavedResources(savedResources) {
  try {
    localStorage.setItem(savedResourcesStorageKey, JSON.stringify(savedResources));
  } catch {
    // Saving is a progressive enhancement; the button should still render if storage is blocked.
  }
}

function getSavedResourceKey(type, id, title, url) {
  const fallback = [id, title, url].find(hasResourceValue) || "resource";

  return `${String(type || "resource").trim().toLowerCase()}:${String(fallback)
    .trim()
    .toLowerCase()}`;
}

function createSaveIcon() {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

  icon.classList.add("resource-save-icon");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "2");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  icon.setAttribute("aria-hidden", "true");
  path.setAttribute("d", "M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z");
  icon.append(path);
  return icon;
}

function createSaveButton({ type, id, title, url }) {
  const button = document.createElement("button");
  const key = getSavedResourceKey(type, id, title, url);

  function setState(isSaved) {
    button.classList.toggle("is-saved", isSaved);
    button.setAttribute("aria-pressed", String(isSaved));
    button.setAttribute("aria-label", `${isSaved ? "Unsave" : "Save"} ${title || "resource"}`);
    button.title = isSaved ? "Unsave" : "Save";
  }

  button.type = "button";
  button.className = "resource-save-button";
  button.dataset.saveKey = key;
  button.append(createSaveIcon());
  setState(Boolean(getSavedResources()[key]));

  button.addEventListener("click", (event) => {
    const savedResources = getSavedResources();
    const isSaved = !savedResources[key];

    event.preventDefault();
    event.stopPropagation();

    if (isSaved) {
      savedResources[key] = {
        type: type || "resource",
        id: id || null,
        title: title || null,
        url: url || null,
        savedAt: new Date().toISOString(),
      };
    } else {
      delete savedResources[key];
    }

    setSavedResources(savedResources);
    setState(isSaved);
  });

  return button;
}

function formatResourceLabel(value) {
  const labels = {
    id: "ID",
    title: "Title",
    authors: "Authors",
    venue: "Venue",
    year: "Year",
    presentation: "Presentation",
    abstract: "Abstract",
    links: "Links",
    pdf: "PDF",
    paper: "Paper",
    supp: "Supplement",
    video: "Video",
    demo: "Demo",
    arxiv: "arXiv",
    code: "Code",
    paperswithcode: "Papers with Code",
    checkpoints: "Checkpoints",
    dataset: "Dataset",
    benchmark: "Benchmark",
    model: "Model",
    project_page: "Project page",
    bibtex: "BibTeX",
    matched_themes: "Matched themes",
    borderline_reason: "Borderline reason",
  };

  return (
    labels[value] ||
    String(value)
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

const paperResourceMeta = {
  paper: {
    label: "Paper",
    order: 0,
    icon: [
      '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>',
      '<path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
      '<path d="M10 9H8"/>',
      '<path d="M16 13H8"/>',
      '<path d="M16 17H8"/>',
    ],
  },
  pdf: {
    label: "PDF",
    order: 1,
    icon: [
      '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>',
      '<path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
      '<path d="M10 9H8"/>',
      '<path d="M16 13H8"/>',
      '<path d="M16 17H8"/>',
    ],
  },
  supp: {
    label: "Supplement",
    order: 2,
    icon: [
      '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>',
      '<path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
      '<path d="M9 15h6"/>',
      '<path d="M12 18v-6"/>',
    ],
  },
  video: {
    label: "Video",
    order: 7,
    icon: ['<circle cx="12" cy="12" r="10"/>', '<path d="m10 8 6 4-6 4V8Z"/>'],
  },
  demo: {
    label: "Demo",
    order: 7.5,
    icon: ['<circle cx="12" cy="12" r="10"/>', '<path d="m10 8 6 4-6 4V8Z"/>'],
  },
  arxiv: {
    label: "arXiv",
    order: 3,
    iconImage: "../images/arxiv-logo.svg",
  },
  code: {
    label: "Code",
    order: 4,
    icon: ['<path d="m18 16 4-4-4-4"/>', '<path d="m6 8-4 4 4 4"/>', '<path d="m14.5 4-5 16"/>'],
  },
  paperswithcode: {
    label: "Papers with Code",
    order: 5,
    icon: ['<path d="m18 16 4-4-4-4"/>', '<path d="m6 8-4 4 4 4"/>', '<path d="m14.5 4-5 16"/>'],
  },
  checkpoints: {
    label: "Checkpoints",
    order: 6,
    icon: [
      '<rect width="16" height="16" x="4" y="4" rx="2"/>',
      '<rect width="6" height="6" x="9" y="9" rx="1"/>',
      '<path d="M15 2v2"/>',
      '<path d="M15 20v2"/>',
      '<path d="M2 15h2"/>',
      '<path d="M2 9h2"/>',
      '<path d="M20 15h2"/>',
      '<path d="M20 9h2"/>',
      '<path d="M9 2v2"/>',
      '<path d="M9 20v2"/>',
    ],
  },
  dataset: {
    label: "Dataset",
    order: 9,
    icon: [
      '<ellipse cx="12" cy="5" rx="9" ry="3"/>',
      '<path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/>',
      '<path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
    ],
  },
  benchmark: {
    label: "Benchmark",
    order: 10,
    icon: ['<path d="M3 3v18h18"/>', '<path d="M18 17V9"/>', '<path d="M13 17V5"/>', '<path d="M8 17v-3"/>'],
  },
  model: {
    label: "Model",
    order: 11,
    icon: [
      '<path d="M2 7.5 12 2l10 5.5-10 5.5z"/>',
      '<path d="M2 12.5 12 18l10-5.5"/>',
      '<path d="M2 17.5 12 23l10-5.5"/>',
    ],
  },
  project_page: {
    label: "Project page",
    order: 12,
    icon: [
      '<circle cx="12" cy="12" r="10"/>',
      '<path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>',
      '<path d="M2 12h20"/>',
    ],
  },
};

function isValidResourceUrl(value) {
  return hasResourceValue(value) && /^https?:\/\//i.test(String(value).trim());
}

function getPaperResourceMeta(key) {
  const normalizedKey = String(key).replace(/_\d+$/, "");
  const baseMeta = paperResourceMeta[key] || paperResourceMeta[normalizedKey];

  if (baseMeta) {
    const suffix = String(key).match(/_(\d+)$/)?.[1];

    return suffix && !paperResourceMeta[key]
      ? {
          ...baseMeta,
          label: `${baseMeta.label} ${suffix}`,
          order: baseMeta.order + Number(suffix) / 100,
        }
      : baseMeta;
  }

  return {
    label: formatResourceLabel(key),
    order: 100,
    icon: paperResourceMeta.project_page.icon,
  };
}

const editableResourceLinkKeys = [
  "paper",
  "pdf",
  "supp",
  "arxiv",
  "code",
  "paperswithcode",
  "checkpoints",
  "video",
  "dataset",
  "benchmark",
  "model",
  "project_page",
];

let resourceEditModalController = null;

function getResourceEditTitle(resource) {
  return String(resource?.title || resource?.name || "resource").trim();
}

function getResourceFallbackLinkKey(resource) {
  return resource.type === "dataset"
    ? "dataset"
    : resource.type === "benchmark"
      ? "benchmark"
      : resource.type === "model"
        ? "model"
        : "project_page";
}

function getResourceLinkSortOrder(key) {
  const normalizedKey = String(key).replace(/_\d+$/, "");
  const meta = paperResourceMeta[key] || paperResourceMeta[normalizedKey];

  return meta?.order ?? 100;
}

function getEditableResourceLinkKeys(resource, links = resource?.links || {}) {
  const keys = new Set(editableResourceLinkKeys);

  Object.keys(links || {}).forEach((key) => {
    if (key) {
      keys.add(key);
    }
  });

  if (hasResourceValue(resource?.url)) {
    keys.add(getResourceFallbackLinkKey(resource));
  }

  return Array.from(keys).sort(
    (firstKey, secondKey) =>
      getResourceLinkSortOrder(firstKey) - getResourceLinkSortOrder(secondKey) ||
      firstKey.localeCompare(secondKey)
  );
}

function getResourceEditLinks(resource) {
  const links = {};
  const resourceLinks = resource?.links || {};

  getEditableResourceLinkKeys(resource, resourceLinks).forEach((key) => {
    links[key] = hasResourceValue(resourceLinks[key]) ? String(resourceLinks[key]).trim() : "";
  });

  if (hasResourceValue(resource?.url)) {
    const urlKey = getResourceFallbackLinkKey(resource);

    links[urlKey] = links[urlKey] || String(resource.url).trim();
  }

  return links;
}

function getResourceEditImages(resource) {
  if (Array.isArray(resource?.images)) {
    return resource.images.filter(hasResourceValue).map((image) => String(image).trim());
  }

  return [];
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getResourceEditIssueUrl(resource, links, images) {
  const issueUrl = new URL(submitIssueUrl);
  const resourceTitle = getResourceEditTitle(resource);
  const resourceType = String(resource?.type || "resource");
  const linkRows = getEditableResourceLinkKeys(resource, links).map((key) => {
    const label = getPaperResourceMeta(key).label;
    const value = links[key]?.trim() || "";

    return `${label}: ${value || "(empty)"}`;
  });
  const imageRows = images.length ? images.map((image) => `- ${image}`) : ["(empty)"];
  const issueBody = [
    `Resource type: ${resourceType}`,
    `Resource ID: ${resource?.id || "(none)"}`,
    `Title: ${resourceTitle}`,
    "",
    "Links:",
    ...linkRows,
    "",
    "Images:",
    ...imageRows,
    "",
    "Submitted from:",
    window.location.href,
  ].join("\n");

  issueUrl.searchParams.set("title", `Edit ${resourceType}: ${resourceTitle}`.slice(0, 180));
  issueUrl.searchParams.set("body", issueBody);
  return issueUrl.toString();
}

function getResourceEditModalTitle(resource) {
  const type = String(resource?.type || "resource").toLowerCase();
  const label =
    type === "paper"
      ? "Paper"
      : type === "dataset"
        ? "Dataset"
        : type === "benchmark"
          ? "Benchmark"
          : type === "model"
            ? "Model"
            : "Resource";

  return `Edit ${label} Links`;
}

function getResourceEditModalDescription(resource) {
  const type = String(resource?.type || "resource").toLowerCase();
  const label =
    type === "paper"
      ? "this paper"
      : type === "dataset"
        ? "this dataset"
        : type === "benchmark"
          ? "this benchmark"
          : type === "model"
            ? "this model"
            : "this resource";

  return `Add, remove, or update URLs associated with ${label}. Include project pages, code, datasets, checkpoints, videos, and other official links.`;
}

function inferResourceEditLinkKey(value) {
  let url = null;

  try {
    url = new URL(value);
  } catch {
    return "project_page";
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const path = url.pathname.toLowerCase();

  if (host === "arxiv.org") {
    return "arxiv";
  }

  if (host.includes("youtube.com") || host.includes("youtu.be") || host.includes("vimeo.com")) {
    return "video";
  }

  if (host === "paperswithcode.com" || host.endsWith(".paperswithcode.com")) {
    return "paperswithcode";
  }

  if (host === "github.com" || host === "gitlab.com" || host === "bitbucket.org") {
    return "code";
  }

  if (host === "huggingface.co") {
    if (path.startsWith("/datasets/")) {
      return "dataset";
    }

    return "model";
  }

  if (path.endsWith(".pdf")) {
    return "pdf";
  }

  return "project_page";
}

function getUniqueResourceEditLinkKey(baseKey, links) {
  if (!hasResourceValue(links[baseKey])) {
    return baseKey;
  }

  for (let index = 2; index < 100; index += 1) {
    const key = `${baseKey}_${index}`;

    if (!hasResourceValue(links[key])) {
      return key;
    }
  }

  return `${baseKey}_${Date.now()}`;
}

function createEditModalRemoveIcon() {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const line = document.createElementNS("http://www.w3.org/2000/svg", "path");

  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "2");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  icon.setAttribute("aria-hidden", "true");
  path.setAttribute("d", "M3 6h18M8 6V4h8v2m-9 0 1 16h8l1-16");
  line.setAttribute("d", "M10 11v6M14 11v6");
  icon.append(path, line);
  return icon;
}

function createResourceEditModal() {
  const modal = document.createElement("div");
  let activeResource = null;
  let activeLinks = {};
  let activeImageRefs = [];
  let previousFocus = null;

  modal.className = "submit-modal edit-modal";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="submit-modal-panel edit-modal-panel" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title" aria-describedby="edit-modal-description">
      <button class="submit-modal-close" type="button" aria-label="Close edit dialog" data-edit-modal-close></button>
      <h2 id="edit-modal-title"></h2>
      <p id="edit-modal-description" class="submit-modal-description"></p>
      <div class="edit-modal-review-note">
        <strong>Your changes will be reviewed by an admin.</strong>
        <span>Submissions are queued for review and do not change the page until an admin approves them.</span>
      </div>
      <form class="submit-modal-form edit-modal-form" novalidate>
        <label class="edit-modal-add-label" for="edit-modal-add-url">Add Link URL</label>
        <div class="edit-modal-add-row">
          <input id="edit-modal-add-url" type="url" autocomplete="url" inputmode="url" placeholder="https://example.com/project" />
          <button class="edit-modal-add-button" type="button" data-edit-modal-add>
            <span aria-hidden="true">+</span>
            Add
          </button>
        </div>
        <div class="edit-modal-fields"></div>
        <label class="edit-modal-images-label" for="edit-modal-image-upload">Upload image</label>
        <input id="edit-modal-image-upload" class="edit-modal-image-upload" type="file" accept="image/*" multiple />
        <p class="submit-modal-hint edit-modal-upload-hint"></p>
        <p class="submit-modal-error" role="alert" hidden></p>
        <div class="submit-modal-actions">
          <button class="submit-modal-primary" type="submit">Submit for review</button>
          <button class="submit-modal-secondary" type="button" data-edit-modal-cancel>Cancel</button>
        </div>
      </form>
    </div>
  `;

  const title = modal.querySelector("#edit-modal-title");
  const description = modal.querySelector("#edit-modal-description");
  const form = modal.querySelector(".edit-modal-form");
  const fields = modal.querySelector(".edit-modal-fields");
  const addInput = modal.querySelector("#edit-modal-add-url");
  const addButton = modal.querySelector("[data-edit-modal-add]");
  const imageUpload = modal.querySelector("#edit-modal-image-upload");
  const uploadHint = modal.querySelector(".edit-modal-upload-hint");
  const error = modal.querySelector(".submit-modal-error");
  const closeButtons = Array.from(
    modal.querySelectorAll("[data-edit-modal-close], [data-edit-modal-cancel]")
  );

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("is-submit-modal-open");
    previousFocus?.focus();
    previousFocus = null;
    activeResource = null;
    activeImageRefs = [];
  }

  function collectLinkInputs() {
    const links = { ...activeLinks };

    fields.querySelectorAll(".edit-modal-link-input").forEach((input) => {
      const value = input.value.trim();

      links[input.name] = value;
    });

    activeLinks = links;
    return links;
  }

  function renderLinkRows() {
    const rows = getEditableResourceLinkKeys(activeResource, activeLinks);

    fields.replaceChildren();

    if (!rows.length) {
      const empty = document.createElement("p");

      empty.className = "edit-modal-empty";
      empty.textContent = "No links yet. Add a URL above.";
      fields.append(empty);
      return;
    }

    rows.forEach((key) => {
      const row = document.createElement("div");
      const icon = document.createElement("span");
      const input = document.createElement("input");
      const type = document.createElement("span");
      const official = document.createElement("span");
      const remove = document.createElement("button");
      const meta = getPaperResourceMeta(key);

      row.className = "edit-modal-link-row";
      if (!hasResourceValue(activeLinks[key])) {
        row.classList.add("is-empty");
      }
      row.dataset.linkKey = key;
      icon.className = "edit-modal-link-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.append(createPaperResourceIcon(key));
      input.className = "edit-modal-link-input";
      input.type = "url";
      input.autocomplete = "url";
      input.inputMode = "url";
      input.name = key;
      input.value = activeLinks[key] || "";
      input.placeholder = "Add URL";
      input.setAttribute("aria-label", `${meta.label} URL`);
      type.className = "edit-modal-link-type";
      type.textContent = meta.label;
      official.className = "edit-modal-official-pill";
      official.textContent = "Official";
      remove.className = "edit-modal-remove";
      remove.type = "button";
      remove.setAttribute("aria-label", `Remove ${meta.label} link`);
      remove.append(createEditModalRemoveIcon());
      remove.addEventListener("click", () => {
        collectLinkInputs();
        activeLinks[key] = "";
        renderLinkRows();
      });

      row.append(icon, input, type, official, remove);
      fields.append(row);
    });
  }

  function addLinkFromInput() {
    const value = addInput.value.trim();

    error.textContent = "";
    error.hidden = true;

    if (!value) {
      addInput.focus();
      return;
    }

    if (!isHttpUrl(value)) {
      error.textContent = "Use a full http(s) URL before adding it.";
      error.hidden = false;
      addInput.focus();
      return;
    }

    collectLinkInputs();
    activeLinks[getUniqueResourceEditLinkKey(inferResourceEditLinkKey(value), activeLinks)] = value;
    addInput.value = "";
    renderLinkRows();
  }

  function openModal(resource, trigger) {
    activeResource = resource || {};
    activeLinks = getResourceEditLinks(activeResource);
    activeImageRefs = getResourceEditImages(activeResource);
    previousFocus = trigger || document.activeElement;
    title.textContent = getResourceEditModalTitle(activeResource);
    description.textContent = getResourceEditModalDescription(activeResource);
    error.textContent = "";
    error.hidden = true;
    addInput.value = "";
    renderLinkRows();
    imageUpload.value = "";
    uploadHint.textContent = activeImageRefs.length
      ? `Existing images: ${activeImageRefs.length}. Choose image files to request new uploads.`
      : "Choose one or more image files to include with the review request.";
    modal.hidden = false;
    document.body.classList.add("is-submit-modal-open");
    window.setTimeout(() => addInput.focus(), 0);
  }

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  addButton.addEventListener("click", addLinkFromInput);
  addInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addLinkFromInput();
    }
  });

  form.addEventListener("submit", (event) => {
    const links = collectLinkInputs();
    const invalidLabels = [];
    const imageRefs = [
      ...activeImageRefs,
      ...Array.from(imageUpload.files || []).map((file) => `Upload: ${file.name}`),
    ];

    event.preventDefault();

    Object.entries(links).forEach(([key, value]) => {
      if (value && !isHttpUrl(value)) {
        invalidLabels.push(getPaperResourceMeta(key).label);
      }
    });

    if (invalidLabels.length) {
      error.textContent = `Use full http(s) links for: ${Array.from(new Set(invalidLabels)).join(", ")}.`;
      error.hidden = false;
      return;
    }

    window.open(getResourceEditIssueUrl(activeResource, links, imageRefs), "_blank", "noopener");
    closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (modal.hidden || event.key !== "Escape") {
      return;
    }

    event.preventDefault();
    closeModal();
  });

  document.body.append(modal);
  return { open: openModal };
}

function openResourceEditModal(resource, trigger) {
  if (!resourceEditModalController) {
    resourceEditModalController = createResourceEditModal();
  }

  resourceEditModalController.open(resource, trigger);
}

function createResourceEditButton(resource) {
  const button = document.createElement("button");
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const label = document.createElement("span");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const title = getResourceEditTitle(resource);

  icon.classList.add("resource-edit-icon");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "2");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  icon.setAttribute("aria-hidden", "true");
  path.setAttribute(
    "d",
    "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
  );
  line.setAttribute("d", "m15 5 4 4");
  icon.append(path, line);
  label.textContent = "Edit links";
  button.type = "button";
  button.className = "resource-edit-button";
  button.setAttribute("aria-label", `Edit links for ${title}`);
  button.append(icon, label);
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openResourceEditModal(resource, button);
  });
  return button;
}

function createPaperResourceIcon(key) {
  const meta = getPaperResourceMeta(key);

  if (meta.iconImage) {
    const icon = document.createElement("span");

    icon.classList.add("paper-card-resource-icon", "paper-card-resource-icon-image");
    icon.style.setProperty("--paper-resource-icon", `url("${new URL(meta.iconImage, siteScriptUrl)}")`);
    icon.setAttribute("aria-hidden", "true");
    return icon;
  }

  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  icon.classList.add("paper-card-resource-icon");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "1.8");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = meta.icon.join("");
  return icon;
}

function getPaperCardUrl(data) {
  const id = String(data?.id || "").trim();
  return id ? `paper.html?id=${encodeURIComponent(id)}` : "";
}

function getPaperItems(payload) {
  return Array.isArray(payload) ? payload : payload.items || payload.papers || [];
}

function normalizeCountLabel(label) {
  const value = String(label || "items").trim().toLowerCase();

  if (value === "papers with code") {
    return "papers";
  }

  return value || "items";
}

async function initDynamicCount(element) {
  const source = element.dataset.countSource || "";
  const label = normalizeCountLabel(element.dataset.countLabel || "items");

  if (!source) {
    return;
  }

  try {
    const response = await fetch(source);

    if (!response.ok) {
      throw new Error(`Unable to load ${source}`);
    }

    const payload = await response.json();
    const count = getPaperItems(payload).length;
    element.textContent = `${count.toLocaleString()} ${label}`;
  } catch {
    element.textContent = "";
  }
}

document.querySelectorAll("[data-count-source]").forEach(initDynamicCount);

function getPaperImageMap(payload) {
  return payload?.images || payload || {};
}

function paperHasImages(paper, imageMap) {
  const id = String(paper?.id || "").trim();

  return hasResourceValue(paper?.images) || hasResourceValue(imageMap[id]);
}

function createFeaturedPaperRow(paper, cardBase) {
  const row = document.createElement("tr");
  const titleCell = document.createElement("td");
  const venueCell = document.createElement("td");
  const linkCell = document.createElement("td");
  const link = document.createElement("a");
  const venueText = [paper.venue, paper.year].filter(hasResourceValue).join(" ");
  const paperUrl = `${cardBase}?id=${encodeURIComponent(String(paper.id || ""))}`;

  if (Number.isFinite(Number(paper.year))) {
    row.dataset.year = String(Number(paper.year));
  }

  titleCell.textContent = String(paper.title || "");
  venueCell.textContent = venueText;
  link.href = paperUrl;
  decorateSourceLink(link, "View paper card", false);
  linkCell.append(link);
  row.append(titleCell, venueCell, linkCell);
  return row;
}

async function initFeaturedPaperTable(table) {
  const source = table.dataset.resourceSrc || "";
  const imageSource = table.dataset.paperImages || "";
  const limit = Number(table.dataset.featuredLimit || 5);
  const cardBase = table.dataset.paperCardBase || "pages/paper.html";
  const tableBody = table.querySelector("tbody");

  if (!source || !imageSource || !tableBody) {
    return;
  }

  try {
    const [paperResponse, imageResponse] = await Promise.all([fetch(source), fetch(imageSource)]);

    if (!paperResponse.ok || !imageResponse.ok) {
      throw new Error("Unable to load featured papers");
    }

    const [paperPayload, imagePayload] = await Promise.all([
      paperResponse.json(),
      imageResponse.json(),
    ]);
    const imageMap = getPaperImageMap(imagePayload);
    const papers = getPaperItems(paperPayload)
      .filter((paper) => paperHasImages(paper, imageMap))
      .slice(0, limit);

    tableBody.replaceChildren(...papers.map((paper) => createFeaturedPaperRow(paper, cardBase)));
  } catch {
    tableBody.replaceChildren();
  }
}

document.querySelectorAll("[data-featured-paper-table]").forEach(initFeaturedPaperTable);

function getDataItems(payload, key) {
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload?.[key] || payload?.items || [];
}

function normalizeCombinedResource(item, type, index) {
  const isDataset = type === "dataset";
  const title = String(isDataset ? item.dataset || item.name || "" : item.benchmark || item.name || "");
  const detail = String(
    isDataset
      ? item.sensorModality || item.sizeResolution || item.source || ""
      : item.metric || item.dataset_or_challenge || item.evidence || ""
  );
  const url = String(
    isDataset
      ? item.sourceUrl || item.source_url || ""
      : /^https?:\/\//i.test(String(item.source_url || "")) ? item.source_url : ""
  );
  const year = Number(item.year) || 0;
  const task = String(item.task || "");
  const typeLabel = isDataset ? "Dataset" : "Benchmark";
  const searchText = [title, typeLabel, task, detail, year, url].join(" ").toLowerCase();

  return {
    index,
    id: String(item.id || item.rawDatasetId || item.dataset || item.benchmark || title || index),
    type,
    typeLabel,
    title,
    task,
    detail,
    url,
    year,
    searchText,
  };
}

function createCombinedResourceRow(item) {
  const row = document.createElement("tr");
  const titleCell = document.createElement("td");
  const typeCell = document.createElement("td");
  const taskCell = document.createElement("td");
  const detailCell = document.createElement("td");
  const linkCell = document.createElement("td");
  const typeTag = document.createElement("span");

  row.dataset.type = item.type;
  if (item.year) {
    row.dataset.year = String(item.year);
  }

  titleCell.textContent = item.title;
  typeTag.className = `resource-type-tag resource-type-${item.type}`;
  typeTag.textContent = item.typeLabel;
  typeCell.append(typeTag);
  taskCell.textContent = item.task;
  detailCell.textContent = item.detail;

  if (item.url) {
    const link = document.createElement("a");

    link.href = item.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    decorateSourceLink(link, `View ${item.type} card`, true);
    linkCell.append(link);
  }

  row.append(titleCell, typeCell, taskCell, detailCell, linkCell);
  return row;
}

function renderSimplePager(pager, currentPage, totalPages, matchCount, pageSize, onPageChange) {
  pager.innerHTML = "";

  if (totalPages <= 1) {
    pager.hidden = true;
    return;
  }

  const pageStart = (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, matchCount);
  const status = document.createElement("span");
  const pages = document.createElement("div");
  const visiblePages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const pageItems = [];

  if (currentPage <= 3) {
    visiblePages.add(2);
    visiblePages.add(3);
  }

  if (currentPage >= totalPages - 2) {
    visiblePages.add(totalPages - 1);
    visiblePages.add(totalPages - 2);
  }

  Array.from(visiblePages)
    .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
    .sort((first, second) => first - second)
    .forEach((pageNumber) => {
      if (pageItems.length && pageNumber - pageItems[pageItems.length - 1] > 1) {
        pageItems.push("gap");
      }
      pageItems.push(pageNumber);
    });

  function createPagerButton(label, disabled, onClick, className = "", ariaLabel = "") {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = label;
    button.disabled = disabled;
    if (className) {
      button.className = className;
    }
    if (ariaLabel) {
      button.setAttribute("aria-label", ariaLabel);
    }
    button.addEventListener("click", onClick);
    return button;
  }

  const previous = createPagerButton(
    "<",
    currentPage === 1,
    () => onPageChange(currentPage - 1),
    "table-pager-step",
    "Previous page"
  );
  const next = createPagerButton(
    ">",
    currentPage === totalPages,
    () => onPageChange(currentPage + 1),
    "table-pager-step",
    "Next page"
  );

  status.className = "table-pager-status";
  status.textContent = `Showing ${pageStart.toLocaleString()}-${pageEnd.toLocaleString()} of ${matchCount.toLocaleString()}`;
  pages.className = "table-pager-pages";
  pages.append(previous);

  pageItems.forEach((pageItem) => {
    if (pageItem === "gap") {
      const gap = document.createElement("span");

      gap.className = "table-pager-gap";
      gap.textContent = "...";
      pages.append(gap);
      return;
    }

    const pageButton = createPagerButton(
      String(pageItem),
      false,
      () => onPageChange(pageItem),
      "table-pager-page",
      `Page ${pageItem}`
    );

    if (pageItem === currentPage) {
      pageButton.classList.add("is-active");
      pageButton.setAttribute("aria-current", "page");
    }

    pages.append(pageButton);
  });

  pages.append(next);
  pager.append(status, pages);
  pager.hidden = false;
}

function getLimitedCombinedItems(items, limit, isBalanced) {
  if (!limit) {
    return items;
  }

  if (!isBalanced) {
    return items.slice(0, limit);
  }

  const datasetLimit = Math.ceil(limit / 2);
  const benchmarkLimit = limit - datasetLimit;
  const limited = items
    .filter((item) => item.type === "dataset")
    .slice(0, datasetLimit)
    .concat(items.filter((item) => item.type === "benchmark").slice(0, benchmarkLimit));

  return limited
    .sort((first, second) => second.year - first.year || first.index - second.index)
    .slice(0, limit);
}

async function initCombinedResourceTable(table) {
  const section = table.closest("section");
  const controls = section?.querySelector("[data-combined-resource-controls]");
  const searchInput = controls?.querySelector("[data-resource-search]");
  const typeFilter = controls?.querySelector("[data-resource-type-filter]");
  const tableBody = table.querySelector("tbody");
  const tableWrap = table.closest(".resource-table-wrap");
  const count = document.createElement("p");
  const pager = document.createElement("nav");
  const limit = Number(table.dataset.combinedLimit || 0);
  const isBalanced = table.dataset.combinedBalanced === "true";
  const pageSize = Number(table.dataset.pageSize || 20);
  let currentPage = 1;
  let items = [];

  if (!tableBody) {
    return;
  }

  if (controls && !limit) {
    count.className = "resource-count resource-count-under-search";
    count.setAttribute("aria-live", "polite");
    searchInput?.closest(".search-control")?.append(count);
    pager.className = "table-pager";
    pager.setAttribute("aria-label", "Table pagination");
    pager.hidden = true;
    tableWrap?.after(pager);
  }

  function applyState() {
    const query = String(searchInput?.value || "").trim().toLowerCase();
    const selectedType = String(typeFilter?.value || "all");
    const filtered = items.filter((item) => {
      const matchesType = selectedType === "all" || item.type === selectedType;
      const matchesQuery = !query || item.searchText.includes(query);

      return matchesType && matchesQuery;
    });
    const sorted = filtered.slice().sort((first, second) => {
      return second.year - first.year || first.index - second.index;
    });
    const visible = limit
      ? getLimitedCombinedItems(sorted, limit, isBalanced)
      : sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    tableBody.replaceChildren(...visible.map(createCombinedResourceRow));

    if (count) {
      const label =
        selectedType === "dataset"
          ? "datasets"
          : selectedType === "benchmark"
            ? "benchmarks"
            : "datasets & benchmarks";

      count.textContent = `${filtered.length.toLocaleString()} ${label}`;
    }

    if (!limit && pager) {
      const totalPages = Math.ceil(filtered.length / pageSize);

      renderSimplePager(pager, currentPage, totalPages, filtered.length, pageSize, (page) => {
        currentPage = page;
        applyState();
      });
    }
  }

  try {
    const [datasetsResponse, benchmarksResponse] = await Promise.all([
      fetch(table.dataset.datasetsSrc || ""),
      fetch(table.dataset.benchmarksSrc || ""),
    ]);

    if (!datasetsResponse.ok || !benchmarksResponse.ok) {
      throw new Error("Unable to load datasets and benchmarks");
    }

    const [datasetsPayload, benchmarksPayload] = await Promise.all([
      datasetsResponse.json(),
      benchmarksResponse.json(),
    ]);
    const datasets = getDataItems(datasetsPayload, "datasets").map((item, index) =>
      normalizeCombinedResource(item, "dataset", index)
    );
    const benchmarks = getDataItems(benchmarksPayload, "benchmarks").map((item, index) =>
      normalizeCombinedResource(item, "benchmark", datasets.length + index)
    );

    items = datasets.concat(benchmarks);
    applyState();
  } catch {
    tableBody.replaceChildren();
    if (count) {
      count.textContent = "";
    }
    if (pager) {
      pager.hidden = true;
    }
  }

  searchInput?.addEventListener("input", () => {
    currentPage = 1;
    applyState();
  });
  typeFilter?.addEventListener("change", () => {
    currentPage = 1;
    applyState();
  });
}

document.querySelectorAll("[data-combined-resource-table]").forEach(initCombinedResourceTable);

function initResourceList(controls) {
  const section = controls.closest("section");
  const searchInput = controls.querySelector("[data-resource-search]");
  const venueFilter = controls.querySelector("[data-venue-filter]");
  const companyFilter = controls.querySelector("[data-company-filter]");
  const companyButtons = Array.from(companyFilter?.querySelectorAll("[data-company]") || []);
  const tableBody = section?.querySelector("tbody");
  const tableWrap = section?.querySelector(".resource-table-wrap");
  const table = section?.querySelector(".resource-table");
  const resourceSrc = controls.dataset.resourceSrc || table?.dataset.resourceSrc || "";
  const isPaperList = table?.classList.contains("resource-table-papers");

  if (!section || !tableBody) {
    return;
  }

  const pageSize = Number(controls.dataset.pageSize || section.dataset.pageSize || 20);
  const pager = document.createElement("nav");
  const count = document.createElement("p");
  const cardLinkLabel = getCardLinkLabel(searchInput);
  let currentPage = 1;
  let rows = [];
  let totalCount = 0;

  count.className = "resource-count resource-count-under-search";
  count.setAttribute("aria-live", "polite");

  const searchControl = searchInput?.closest(".search-control");
  if (searchControl) {
    searchControl.append(count);
  } else {
    searchControl?.after(count);
  }

  pager.className = "table-pager";
  pager.setAttribute("aria-label", "Table pagination");
  pager.hidden = true;
  tableWrap?.after(pager);

  decorateSourceLinks(table, cardLinkLabel);

  const fallbackRows = Array.from(tableBody.querySelectorAll("tr")).map((row, index) => ({
    index,
    row,
    name: row.cells[0]?.textContent.trim().toLowerCase() || "",
    searchText: row.textContent.toLowerCase(),
    venue: row.dataset.venue || "",
    venueLabel: getFallbackVenueLabel(row),
    companies: getRowCompanyKeys(row),
    year: getRowYear(row),
  }));
  rows = fallbackRows;
  totalCount = rows.length;
  const countLabel = normalizeCountLabel(
    searchInput?.placeholder?.replace(/^Search\s+/i, "").trim() || "items"
  );
  const sortState = { column: "year", direction: "desc" };
  const dynamicColumns = Array.from(table?.querySelectorAll("thead th[data-field]") || []).map(
    (header) => ({
      field: header.dataset.field || "",
      isLink: header.dataset.linkField === "true" || header.dataset.field === "sourceUrl",
    })
  );
  const paperListState = getPaperListUrlState();
  let pendingVenue = isPaperList ? paperListState.venue : "";

  if (isPaperList && searchInput) {
    searchInput.value = paperListState.query;
    currentPage = paperListState.page;
  }

  function getPaperListUrlState() {
    if (!isPaperList) {
      return { query: "", venue: "", page: 1 };
    }

    const params = new URLSearchParams(window.location.search);
    const page = Math.max(1, Number.parseInt(params.get("page") || "1", 10) || 1);

    return {
      query: params.get("q") || "",
      venue: params.get("venue") || "",
      page,
    };
  }

  function updatePaperListUrlState() {
    if (!isPaperList || !window.history?.replaceState) {
      return;
    }

    const url = new URL(window.location.href);
    const query = (searchInput?.value || "").trim();
    const venue = venueFilter?.value || "";

    if (query) {
      url.searchParams.set("q", query);
    } else {
      url.searchParams.delete("q");
    }

    if (venue) {
      url.searchParams.set("venue", venue);
    } else {
      url.searchParams.delete("venue");
    }

    if (currentPage > 1) {
      url.searchParams.set("page", String(currentPage));
    } else {
      url.searchParams.delete("page");
    }

    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function addPaperListReturnToLink(link) {
    if (!isPaperList || !link?.href) {
      return;
    }

    const url = new URL(link.href, window.location.href);

    if (!url.pathname.endsWith("/paper.html") || !url.searchParams.has("id")) {
      return;
    }

    updatePaperListUrlState();
    url.searchParams.set("from", window.location.href);
    link.href = url.toString();
  }

  function getSelectedCompany() {
    return (
      companyButtons.find((button) => button.classList.contains("is-active"))?.dataset.company ||
      "all"
    );
  }

  function createPagerButton(label, disabled, onClick, className = "", ariaLabel = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.disabled = disabled;
    if (className) {
      button.className = className;
    }
    if (ariaLabel) {
      button.setAttribute("aria-label", ariaLabel);
    }
    button.addEventListener("click", onClick);
    return button;
  }

  function updateSortHeaders() {
    table?.querySelectorAll("th[data-sort-column]").forEach((header) => {
      const isActive = header.dataset.sortColumn === sortState.column;
      const direction = sortState.direction === "asc" ? "ascending" : "descending";
      const button = header.querySelector("button");

      header.setAttribute("aria-sort", isActive ? direction : "none");

      if (button) {
        button.dataset.active = String(isActive);
        button.dataset.direction = isActive ? sortState.direction : "";
      }
    });
  }

  function createSortHeader(header, column, defaultDirection) {
    const label = header.textContent.trim();
    const button = document.createElement("button");

    header.dataset.sortColumn = column;
    header.setAttribute("aria-sort", "none");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", () => {
      if (sortState.column === column) {
        sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
      } else {
        sortState.column = column;
        sortState.direction = defaultDirection;
      }

      currentPage = 1;
      applyState();
    });

    header.textContent = "";
    header.append(button);
  }

  function initSortableHeaders() {
    const headers = Array.from(table?.querySelectorAll("thead th") || []);
    const nameHeader = headers[0];
    const yearHeader = headers.find((header) => /venue\s*\/\s*year/i.test(header.textContent));

    if (nameHeader) {
      createSortHeader(nameHeader, "name", "asc");
    }

    if (yearHeader) {
      createSortHeader(yearHeader, "year", "desc");
    }

    updateSortHeaders();
  }

  function normalizeVenueKey(value) {
    const venue = String(value || "").trim().toLowerCase();

    if (!venue) {
      return "";
    }

    if (venue.startsWith("ieee")) {
      return "ieee";
    }

    if (venue.includes("remote sensing")) {
      return "remote-sensing";
    }

    return venue.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function getVenueLabel(value, key = "") {
    const label = String(value || "").trim();

    if (label) {
      return label;
    }

    return String(key || "")
      .split("-")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function getFallbackVenueLabel(row) {
    const label = String(row.dataset.venueLabel || "").trim();

    if (label) {
      return label;
    }

    return getVenueLabel(
      String(row.cells[1]?.textContent || "")
        .replace(/\b(?:19|20)\d{2}\b/g, "")
        .trim(),
      row.dataset.venue || ""
    );
  }

  function populateVenueFilter(items) {
    if (!venueFilter) {
      return;
    }

    const selectedVenue = pendingVenue || venueFilter.value;
    const allOption = document.createElement("option");
    const venueOptions = new Map();

    allOption.value = "";
    allOption.textContent = "All venues";

    items.forEach((item) => {
      if (!item.venue || venueOptions.has(item.venue)) {
        return;
      }

      venueOptions.set(item.venue, item.venueLabel || getVenueLabel("", item.venue));
    });

    const options = Array.from(venueOptions, ([value, label]) => ({ value, label }))
      .sort((first, second) => first.label.localeCompare(second.label, undefined, {
        sensitivity: "base",
      }))
      .map(({ value, label }) => {
        const option = document.createElement("option");

        option.value = value;
        option.textContent = label;
        return option;
      });

    venueFilter.replaceChildren(allOption, ...options);
    venueFilter.value = venueOptions.has(selectedVenue) ? selectedVenue : "";
    pendingVenue = "";
  }

  function getDynamicField(data, field) {
    if (field === "venueYear") {
      return data.venueYear || [data.venue, data.year].filter(Boolean).join(" ");
    }

    if (field === "sourceUrl") {
      if (isPaperList) {
        return getPaperCardUrl(data);
      }

      return (
        data.sourceUrl ||
        data.links?.arxiv ||
        data.links?.pdf ||
        data.links?.project_page ||
        data.links?.project ||
        data.links?.code ||
        data.links?.dataset ||
        data.links?.benchmark ||
        data.links?.model ||
        ""
      );
    }

    if (field === "topic") {
      return data.topic || "";
    }

    return data[field];
  }

  function createDynamicRow(data) {
    const row = document.createElement("tr");
    const showSourceIcons = table?.dataset.sourceIcons !== "false";
    const venueKey = data.venueKey || normalizeVenueKey(data.venue);

    if (venueKey) {
      row.dataset.venue = venueKey;
    }

    if (Number.isFinite(Number(data.year))) {
      row.dataset.year = String(Number(data.year));
    }

    dynamicColumns.forEach(({ field, isLink }) => {
      const cell = document.createElement("td");

      if (isLink) {
        const link = document.createElement("a");
        const url = String(getDynamicField(data, field) || "");

        if (!url) {
          row.append(cell);
          return;
        }

        link.href = url;
        if (/^https?:\/\//i.test(url)) {
          link.target = "_blank";
          link.rel = "noreferrer";
        }
        decorateSourceLink(link, cardLinkLabel, showSourceIcons);
        cell.append(link);
      } else if (isPaperList && field === "title") {
        const titleWrap = document.createElement("div");
        const title = document.createElement("span");

        titleWrap.className = "paper-title-cell";
        title.className = "paper-title-text";
        title.textContent = String(getDynamicField(data, field) || "");
        titleWrap.append(title);

        if (hasResourceValue(data.authors)) {
          const authors = document.createElement("span");
          authors.className = "paper-title-authors";
          authors.textContent = String(data.authors);
          titleWrap.append(authors);
        }

        cell.append(titleWrap);
      } else {
        cell.textContent = String(getDynamicField(data, field) || "");
      }

      row.append(cell);
    });

    return row;
  }

  function normalizeDynamicItem(data, index) {
    const firstField = dynamicColumns[0]?.field || "title";
    const name = String(getDynamicField(data, firstField) || data.name || data.title || "").toLowerCase();
    const searchText = String(
      data.searchText ||
        [
          ...dynamicColumns.map(({ field }) => getDynamicField(data, field) || ""),
          data.authors,
          data.abstract,
          data.bibtex,
          data.links && Object.values(data.links).filter(Boolean).join(" "),
        ].join(" ")
    ).toLowerCase();

    return {
      index,
      item: data,
      row: null,
      name,
      searchText,
      venue: data.venueKey || normalizeVenueKey(data.venue),
      venueLabel: getVenueLabel(data.venue, data.venueKey || normalizeVenueKey(data.venue)),
      companies: [],
      year: Number(data.year) || 0,
    };
  }

  async function loadDynamicRows() {
    count.textContent = "";

    try {
      const response = await fetch(resourceSrc);

      if (!response.ok) {
        throw new Error(`Unable to load ${resourceSrc}`);
      }

      const payload = await response.json();
      const items = getPaperItems(payload);

      rows = items.map(normalizeDynamicItem);
      totalCount = rows.length;
      currentPage = isPaperList ? paperListState.page : 1;
      populateVenueFilter(rows);
      applyState();
    } catch {
      rows = fallbackRows;
      totalCount = rows.length;
      currentPage = isPaperList ? paperListState.page : 1;
      populateVenueFilter(rows);
      applyState();
    }
  }

  function renderPager(matchCount) {
    const totalPages = Math.ceil(matchCount / pageSize);

    pager.innerHTML = "";

    if (totalPages <= 1) {
      pager.hidden = true;
      return;
    }

    const pageStart = (currentPage - 1) * pageSize + 1;
    const pageEnd = Math.min(currentPage * pageSize, matchCount);
    const status = document.createElement("span");
    const pages = document.createElement("div");
    const visiblePages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
    const pageItems = [];

    if (currentPage <= 3) {
      visiblePages.add(2);
      visiblePages.add(3);
    }

    if (currentPage >= totalPages - 2) {
      visiblePages.add(totalPages - 1);
      visiblePages.add(totalPages - 2);
    }

    Array.from(visiblePages)
      .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
      .sort((first, second) => first - second)
      .forEach((pageNumber) => {
        if (pageItems.length && pageNumber - pageItems[pageItems.length - 1] > 1) {
          pageItems.push("gap");
        }
        pageItems.push(pageNumber);
      });

    const previousButton = createPagerButton(
      "<",
      currentPage === 1,
      () => {
        currentPage -= 1;
        applyState();
      },
      "table-pager-step",
      "Previous page"
    );
    const nextButton = createPagerButton(
      ">",
      currentPage === totalPages,
      () => {
        currentPage += 1;
        applyState();
      },
      "table-pager-step",
      "Next page"
    );

    status.className = "table-pager-status";
    status.textContent = `Showing ${pageStart.toLocaleString()}-${pageEnd.toLocaleString()} of ${matchCount.toLocaleString()}`;
    pages.className = "table-pager-pages";
    pages.append(previousButton);

    pageItems.forEach((pageItem) => {
      if (pageItem === "gap") {
        const gap = document.createElement("span");
        gap.className = "table-pager-gap";
        gap.textContent = "...";
        pages.append(gap);
        return;
      }

      const pageButton = createPagerButton(
        String(pageItem),
        false,
        () => {
          currentPage = pageItem;
          applyState();
        },
        "table-pager-page",
        `Page ${pageItem}`
      );

      if (pageItem === currentPage) {
        pageButton.classList.add("is-active");
        pageButton.setAttribute("aria-current", "page");
      }

      pages.append(pageButton);
    });

    pages.append(nextButton);
    pager.append(status, pages);
    pager.hidden = false;
  }

  function applyState() {
    const query = (searchInput?.value || "").trim().toLowerCase();
    const selectedVenue = venueFilter?.value || "";
    const selectedCompany = getSelectedCompany();

    const orderedRows = [...rows].sort((first, second) => {
      if (sortState.column === "name") {
        const nameDelta = first.name.localeCompare(second.name, undefined, {
          sensitivity: "base",
        });
        return (sortState.direction === "asc" ? nameDelta : -nameDelta) || first.index - second.index;
      }

      const yearDelta =
        sortState.direction === "asc" ? first.year - second.year : second.year - first.year;
      return yearDelta || first.name.localeCompare(second.name, undefined, { sensitivity: "base" });
    });

    const matchingRows = orderedRows.filter((item) => {
      const matchesSearch = !query || item.searchText.includes(query);
      const matchesVenue = !selectedVenue || item.venue === selectedVenue;
      const matchesCompany =
        selectedCompany === "all" || item.companies.includes(selectedCompany);

      return matchesSearch && matchesVenue && matchesCompany;
    });
    const totalPages = Math.max(1, Math.ceil(matchingRows.length / pageSize));

    currentPage = Math.min(currentPage, totalPages);

    const pageStart = (currentPage - 1) * pageSize;
    const pageEnd = pageStart + pageSize;
    const visibleRows = matchingRows.slice(pageStart, pageEnd).map((item) => {
      if (item.row) {
        return item.row;
      }

      item.row = createDynamicRow(item.item);
      return item.row;
    });

    tableBody.replaceChildren(...visibleRows);

    count.textContent = `${matchingRows.length.toLocaleString()} ${countLabel}`;
    updateSortHeaders();
    renderPager(matchingRows.length);
    updatePaperListUrlState();
  }

  searchInput?.addEventListener("input", () => {
    currentPage = 1;
    applyState();
  });

  venueFilter?.addEventListener("change", () => {
    currentPage = 1;
    applyState();
  });

  companyButtons.forEach((button) => {
    button.addEventListener("click", () => {
      companyButtons.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-pressed", String(isActive));
      });

      currentPage = 1;
      applyState();
    });
  });

  if (isPaperList) {
    tableBody.addEventListener("click", (event) => {
      const link = event.target.closest("a");

      if (link) {
        addPaperListReturnToLink(link);
      }
    });
  }

  initSortableHeaders();

  if (resourceSrc && dynamicColumns.length) {
    loadDynamicRows();
    return;
  }

  populateVenueFilter(rows);
  applyState();
}

document.querySelectorAll("[data-resource-list]").forEach(initResourceList);

function initModelCardSaveButtons() {
  document.querySelectorAll(".model-card-hero").forEach((hero) => {
    const title = hero.querySelector("h1");

    if (!title || hero.querySelector(".resource-save-button")) {
      return;
    }

    const titleRow = document.createElement("div");

    titleRow.className = "model-card-title-row";
    title.before(titleRow);
    titleRow.append(
      title,
      createSaveButton({
        type: "model",
        id: window.location.pathname,
        title: title.textContent.trim(),
        url: window.location.href,
      })
    );
  });
}

function getModelCardLinkKey(link, index) {
  const text = String(link.textContent || "").toLowerCase();
  const href = String(link.href || "").toLowerCase();

  if (text.includes("paper") || href.includes("arxiv.org")) {
    return "paper";
  }

  if (text.includes("dataset")) {
    return "dataset";
  }

  if (text.includes("github") || href.includes("github.com")) {
    return "code";
  }

  if (text.includes("model") || href.includes("huggingface.co")) {
    return "model";
  }

  return index === 0 ? "project_page" : `project_page_${index}`;
}

function initModelCardResourceEditButtons() {
  document.querySelectorAll(".model-card-links").forEach((section) => {
    const heading = section.querySelector("h2");
    const title = document.querySelector(".model-card-hero h1")?.textContent.trim() || "Model";
    const links = {};

    if (!heading || section.querySelector(".resource-edit-button")) {
      return;
    }

    Array.from(section.querySelectorAll("a")).forEach((link, index) => {
      const key = getModelCardLinkKey(link, index);

      if (editableResourceLinkKeys.includes(key) && !links[key]) {
        links[key] = link.href;
      } else if (!links.project_page) {
        links.project_page = link.href;
      }
    });

    const headingRow = document.createElement("div");

    headingRow.className = "model-card-links-head";
    heading.before(headingRow);
    headingRow.append(
      heading,
      createResourceEditButton({
        type: "model",
        id: window.location.pathname,
        title,
        url: window.location.href,
        links,
      })
    );
  });
}

initModelCardSaveButtons();
initModelCardResourceEditButtons();

function appendText(parent, text) {
  if (!hasResourceValue(text)) {
    return null;
  }

  const paragraph = document.createElement("p");
  paragraph.textContent = String(text);
  parent.append(paragraph);
  return paragraph;
}

function setupExpandableAbstract(section, paragraph) {
  if (!section || !paragraph) {
    return;
  }

  const collapsedLabel = "+ read full abstract";
  const expandedLabel = "- collapse abstract";
  const toggle = document.createElement("button");
  const mobileQuery = window.matchMedia("(max-width: 600px)");

  toggle.className = "paper-card-abstract-toggle";
  toggle.type = "button";
  toggle.textContent = collapsedLabel;
  toggle.setAttribute("aria-expanded", "false");

  function updateToggle() {
    const isExpanded = section.classList.contains("is-expanded");

    toggle.textContent = isExpanded ? expandedLabel : collapsedLabel;
    toggle.setAttribute("aria-expanded", String(isExpanded));

    window.requestAnimationFrame(() => {
      const wasExpanded = section.classList.contains("is-expanded");

      section.classList.remove("is-expanded");
      const clampedHeight = paragraph.getBoundingClientRect().height;
      section.classList.add("is-expanded");
      const expandedHeight = paragraph.getBoundingClientRect().height;
      section.classList.toggle("is-expanded", wasExpanded);
      const hasOverflow = expandedHeight > clampedHeight + 1;

      toggle.hidden = !mobileQuery.matches || !hasOverflow;
    });
  }

  toggle.addEventListener("click", () => {
    section.classList.toggle("is-expanded");
    updateToggle();
  });

  paragraph.classList.add("paper-card-abstract-text");
  section.append(toggle);
  updateToggle();
  window.addEventListener("resize", updateToggle);
}

function getPaperLinkEntries(links) {
  return Object.entries(links || {})
    .filter(([, value]) => isValidResourceUrl(value))
    .sort(([firstKey], [secondKey]) => {
      const firstMeta = getPaperResourceMeta(firstKey);
      const secondMeta = getPaperResourceMeta(secondKey);
      return firstMeta.order - secondMeta.order || firstKey.localeCompare(secondKey);
    });
}

function hasPaperLinks(links) {
  return getPaperLinkEntries(links).length > 0;
}

function appendPaperLinks(parent, links) {
  const entries = getPaperLinkEntries(links);

  if (!entries.length) {
    return 0;
  }

  entries.forEach(([key, value]) => {
    const link = document.createElement("a");
    const label = document.createElement("span");
    const meta = getPaperResourceMeta(key);

    link.href = String(value).trim();
    link.target = "_blank";
    link.rel = "noreferrer";
    label.textContent = meta.label;
    link.append(createPaperResourceIcon(key), label);

    parent.append(link);
  });

  return entries.length;
}

function formatPaperAuthors(authors) {
  return String(authors)
    .split(/\s*,\s*/)
    .map((author) => author.trim())
    .filter(Boolean)
    .join(" · ");
}

function getPaperLead(data, venueText = "") {
  if (hasResourceValue(data.presentation)) {
    return [data.presentation, venueText].filter(hasResourceValue).join(" ");
  }

  return [data.one_line_summary, data.summary_line].find(hasResourceValue) || "";
}

function normalizePaperImageList(images) {
  if (!Array.isArray(images)) {
    return [];
  }

  return images.filter(hasResourceValue).map((image) => String(image));
}

function createPaperImageChevronIcon(direction) {
  const icon = document.createElement("span");
  icon.className = `paper-image-chevron paper-image-chevron-${direction}`;
  icon.setAttribute("aria-hidden", "true");
  return icon;
}

function createPaperImageDot(index, imageCount, onClick) {
  const dot = document.createElement("button");

  dot.type = "button";
  dot.className = "paper-image-dot";
  dot.setAttribute("aria-label", `Show image ${index + 1} of ${imageCount}`);
  dot.addEventListener("click", onClick);

  return dot;
}

function updatePaperImageDots(dots, activeIndex) {
  dots.forEach((dot, index) => {
    const isActive = index === activeIndex;

    dot.classList.toggle("is-active", isActive);
    dot.setAttribute("aria-pressed", String(isActive));
  });
}

function openPaperImageViewer(images, startIndex, paperTitle) {
  const imageList = normalizePaperImageList(images);

  if (!imageList.length) {
    return;
  }

  const viewer = document.createElement("div");
  const header = document.createElement("div");
  const closeButton = document.createElement("button");
  const imageWrap = document.createElement("div");
  const image = document.createElement("img");
  const footer = document.createElement("div");
  const previousButton = document.createElement("button");
  const nextButton = document.createElement("button");
  const dots = document.createElement("div");
  const dotButtons = [];
  let activeIndex = Math.min(Math.max(startIndex, 0), imageList.length - 1);

  function setActiveImage(index) {
    activeIndex = (index + imageList.length) % imageList.length;
    image.src = imageList[activeIndex];
    image.alt = `${paperTitle || "Paper"} image ${activeIndex + 1}`;
    updatePaperImageDots(dotButtons, activeIndex);
  }

  function closeViewer() {
    document.removeEventListener("keydown", handleKeydown);
    document.body.classList.remove("is-paper-viewer-open");
    viewer.remove();
  }

  function handleKeydown(event) {
    if (event.key === "Escape") {
      closeViewer();
      return;
    }

    if (imageList.length < 2) {
      return;
    }

    if (event.key === "ArrowLeft") {
      setActiveImage(activeIndex - 1);
    } else if (event.key === "ArrowRight") {
      setActiveImage(activeIndex + 1);
    }
  }

  viewer.className = "paper-image-viewer";
  viewer.setAttribute("role", "dialog");
  viewer.setAttribute("aria-modal", "true");
  viewer.setAttribute("aria-label", "Paper image viewer");
  header.className = "paper-image-viewer-header";
  closeButton.type = "button";
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", closeViewer);
  imageWrap.className = "paper-image-viewer-image";
  footer.className = "paper-image-viewer-footer";
  previousButton.type = "button";
  previousButton.className = "paper-image-viewer-arrow paper-image-viewer-arrow-left";
  previousButton.setAttribute("aria-label", "Show previous image");
  previousButton.append(createPaperImageChevronIcon("left"));
  previousButton.addEventListener("click", () => setActiveImage(activeIndex - 1));
  nextButton.type = "button";
  nextButton.className = "paper-image-viewer-arrow paper-image-viewer-arrow-right";
  nextButton.setAttribute("aria-label", "Show next image");
  nextButton.append(createPaperImageChevronIcon("right"));
  nextButton.addEventListener("click", () => setActiveImage(activeIndex + 1));
  dots.className = "paper-image-dots";

  if (imageList.length > 1) {
    imageList.forEach((_, index) => {
      const dot = createPaperImageDot(index, imageList.length, () => setActiveImage(index));

      dotButtons.push(dot);
      dots.append(dot);
    });
  }

  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) {
      closeViewer();
    }
  });

  header.append(closeButton);
  imageWrap.append(image);
  if (imageList.length > 1) {
    imageWrap.append(previousButton, nextButton);
    footer.append(dots);
  }
  viewer.append(header, imageWrap);
  if (imageList.length > 1) {
    viewer.append(footer);
  }
  document.body.append(viewer);
  document.body.classList.add("is-paper-viewer-open");
  document.addEventListener("keydown", handleKeydown);
  setActiveImage(activeIndex);
  closeButton.focus();
}

function appendPaperImages(parent, images, paperTitle) {
  const imageList = normalizePaperImageList(images);

  if (!imageList.length) {
    return;
  }

  const gallery = document.createElement("div");
  const frame = document.createElement("div");
  const stage = document.createElement("button");
  const image = document.createElement("img");
  const controls = document.createElement("div");
  const nav = document.createElement("div");
  const previousButton = document.createElement("button");
  const nextButton = document.createElement("button");
  const dots = document.createElement("div");
  const dotButtons = [];
  let activeIndex = 0;

  function setActiveImage(index) {
    activeIndex = (index + imageList.length) % imageList.length;
    image.src = imageList[activeIndex];
    image.alt = `${paperTitle || "Paper"} image ${activeIndex + 1}`;
    updatePaperImageDots(dotButtons, activeIndex);
  }

  gallery.className = "paper-card-images";
  frame.className = "paper-image-frame";
  stage.className = "paper-image-stage";
  stage.type = "button";
  stage.setAttribute("aria-label", "Open paper image full screen");
  stage.addEventListener("click", () => openPaperImageViewer(imageList, activeIndex, paperTitle));
  image.loading = "eager";
  image.decoding = "async";
  controls.className = "paper-image-controls";
  nav.className = "paper-image-nav";
  previousButton.type = "button";
  previousButton.setAttribute("aria-label", "Show previous image");
  previousButton.append(createPaperImageChevronIcon("left"));
  previousButton.addEventListener("click", () => setActiveImage(activeIndex - 1));
  nextButton.type = "button";
  nextButton.setAttribute("aria-label", "Show next image");
  nextButton.append(createPaperImageChevronIcon("right"));
  nextButton.addEventListener("click", () => setActiveImage(activeIndex + 1));
  dots.className = "paper-image-dots";

  stage.append(image);
  frame.append(stage);
  gallery.append(frame);

  if (imageList.length > 1) {
    imageList.forEach((_, index) => {
      const dot = createPaperImageDot(index, imageList.length, () => setActiveImage(index));

      dotButtons.push(dot);
      dots.append(dot);
    });

    nav.append(previousButton, nextButton);
    controls.append(dots);
    frame.append(nav);
    gallery.append(controls);
  }

  setActiveImage(0);
  parent.append(gallery);
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the textarea copy fallback.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  textarea.style.left = "-1000px";
  document.body.append(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}

function appendPaperBibtex(parent, bibtex) {
  if (!hasResourceValue(bibtex)) {
    return;
  }

  const bibtexText = String(bibtex);
  const section = document.createElement("section");
  const heading = document.createElement("h2");
  const codeBox = document.createElement("div");
  const copyButton = document.createElement("button");
  const copyIcon = document.createElement("span");
  const pre = document.createElement("pre");
  const code = document.createElement("code");
  let resetTimer = null;

  section.className = "paper-card-bibtex";
  heading.textContent = "BibTeX";
  codeBox.className = "paper-card-codebox";
  copyButton.className = "paper-card-copy";
  copyButton.type = "button";
  copyButton.title = "Copy BibTeX";
  copyButton.setAttribute("aria-label", "Copy BibTeX");
  copyIcon.className = "paper-card-copy-icon";
  copyIcon.setAttribute("aria-hidden", "true");
  copyButton.append(copyIcon);
  copyButton.addEventListener("click", async () => {
    const didCopy = await copyTextToClipboard(bibtexText);

    if (!didCopy) {
      return;
    }

    window.clearTimeout(resetTimer);
    copyButton.classList.add("is-copied");
    copyButton.title = "Copied";
    copyButton.setAttribute("aria-label", "Copied BibTeX");
    resetTimer = window.setTimeout(() => {
      copyButton.classList.remove("is-copied");
      copyButton.title = "Copy BibTeX";
      copyButton.setAttribute("aria-label", "Copy BibTeX");
    }, 2000);
  });
  code.textContent = bibtexText;
  pre.append(code);
  codeBox.append(copyButton, pre);
  section.append(heading, codeBox);
  parent.append(section);
}

function getPaperCardReturnUrl() {
  const params = new URLSearchParams(window.location.search);
  const from = params.get("from");

  if (!from) {
    return "papers.html";
  }

  try {
    const url = new URL(from, window.location.href);

    if (url.origin === window.location.origin && url.pathname.endsWith("/papers.html")) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return "papers.html";
  }

  return "papers.html";
}

function renderPaperCard(container, data, images = []) {
  const article = document.createElement("article");
  const hero = document.createElement("header");
  const topbar = document.createElement("div");
  const meta = document.createElement("p");
  const closeLink = document.createElement("a");
  const titleRow = document.createElement("div");
  const title = document.createElement("h1");
  const body = document.createElement("div");
  const metaText = [data.venue, data.year].filter(hasResourceValue).join(" ");
  const hasPresentation = hasResourceValue(data.presentation);
  const leadText = getPaperLead(data, metaText);
  const shouldShowMetaTag = hasResourceValue(metaText) && !hasPresentation;
  const editResource = {
    type: "paper",
    id: data.id,
    title: data.title,
    url: window.location.href,
    links: data.links,
    images,
  };

  document.title = `${data.title || "Paper"} - GeoMind`;

  article.className = "paper-card-article";
  hero.className = "paper-card-hero";
  topbar.className = "paper-card-topbar";
  titleRow.className = "paper-card-title-row";
  meta.className = "paper-card-meta paper-card-venue-tag";
  meta.textContent = metaText || "Paper";
  closeLink.className = "paper-card-close";
  closeLink.href = getPaperCardReturnUrl();
  closeLink.setAttribute("aria-label", "Close paper card");
  closeLink.title = "Close";
  title.textContent = data.title || "Paper";
  topbar.append(closeLink);
  titleRow.append(
    title,
    createSaveButton({
      type: "paper",
      id: data.id,
      title: data.title,
      url: window.location.href,
    })
  );
  hero.append(topbar, titleRow);

  if (hasResourceValue(data.authors)) {
    const authors = document.createElement("p");
    authors.className = "paper-card-authors";
    authors.textContent = formatPaperAuthors(data.authors);
    hero.append(authors);
  }

  if (hasResourceValue(leadText)) {
    const lead = document.createElement("p");
    lead.className = "paper-card-lead";
    if (hasPresentation) {
      lead.classList.add("paper-card-presentation-tag");
    }
    lead.textContent = String(leadText);
    hero.append(lead);
  }

  body.className = "paper-card-body";

  if (hasResourceValue(data.abstract)) {
    const abstract = document.createElement("section");
    const headingRow = document.createElement("div");
    const heading = document.createElement("h2");

    abstract.className = "paper-card-section paper-card-abstract";
    headingRow.className = "paper-card-section-head";
    heading.textContent = "Abstract";
    headingRow.append(heading);
    if (shouldShowMetaTag) {
      headingRow.append(meta);
    }
    abstract.append(headingRow);
    setupExpandableAbstract(abstract, appendText(abstract, data.abstract));
    body.append(abstract);
  }

  if (hasResourceValue(images)) {
    const figures = document.createElement("section");
    const heading = document.createElement("h2");

    figures.className = "paper-card-section paper-card-figures";
    heading.textContent = "Figures";
    figures.append(heading);
    appendPaperImages(figures, images, data.title);
    body.append(figures);
  }

  {
    const links = document.createElement("section");
    const linksHeadingRow = document.createElement("div");
    const linksHeading = document.createElement("h2");
    const linksRow = document.createElement("div");
    const linkList = document.createElement("div");

    links.className = "paper-card-section paper-card-resources";
    linksHeadingRow.className = "paper-card-section-head";
    linksRow.className = "paper-card-links-row";
    linksHeading.textContent = "Links";
    linkList.className = "paper-card-links";
    linksHeadingRow.append(linksHeading);
    links.append(linksHeadingRow);
    appendPaperLinks(linkList, data.links);
    linksRow.append(linkList, createResourceEditButton(editResource));
    links.append(linksRow);
    body.append(links);
  }

  appendPaperBibtex(body, data.bibtex);
  article.append(hero, body);
  container.replaceChildren(article);
}

async function initPaperCardPage(container) {
  const source = container.dataset.paperSource || "../data/papers.json";
  const imageSource = container.dataset.paperImages || "../data/paper-images.json";
  const params = new URLSearchParams(window.location.search);
  const paperId = params.get("id") || "";

  if (!paperId) {
    container.textContent = "Paper not found.";
    return;
  }

  try {
    const response = await fetch(source);

    if (!response.ok) {
      throw new Error(`Unable to load ${source}`);
    }

    const payload = await response.json();
    const paper = getPaperItems(payload).find((item) => item.id === paperId);
    let imageMap = {};

    if (!paper) {
      container.textContent = "Paper not found.";
      return;
    }

    try {
      const imageResponse = await fetch(imageSource);

      if (imageResponse.ok) {
        const imagePayload = await imageResponse.json();
        imageMap = imagePayload.images || imagePayload || {};
      }
    } catch {
      imageMap = {};
    }

    renderPaperCard(container, paper, normalizePaperImageList(paper.images || imageMap[paper.id]));
  } catch {
    container.textContent = "Paper not found.";
  }
}

document.querySelectorAll("[data-paper-card]").forEach(initPaperCardPage);
