const menuButtons = Array.from(document.querySelectorAll(".menu-button"));

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
    order: 3,
    icon: ['<circle cx="12" cy="12" r="10"/>', '<path d="m10 8 6 4-6 4V8Z"/>'],
  },
  demo: {
    label: "Demo",
    order: 4,
    icon: ['<circle cx="12" cy="12" r="10"/>', '<path d="m10 8 6 4-6 4V8Z"/>'],
  },
  arxiv: {
    label: "arXiv",
    order: 5,
    icon: [
      '<path d="M12 7v14"/>',
      '<path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    ],
  },
  code: {
    label: "Code",
    order: 6,
    icon: ['<path d="m18 16 4-4-4-4"/>', '<path d="m6 8-4 4 4 4"/>', '<path d="m14.5 4-5 16"/>'],
  },
  checkpoints: {
    label: "Checkpoints",
    order: 7,
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
    order: 8,
    icon: [
      '<ellipse cx="12" cy="5" rx="9" ry="3"/>',
      '<path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/>',
      '<path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
    ],
  },
  benchmark: {
    label: "Benchmark",
    order: 9,
    icon: ['<path d="M3 3v18h18"/>', '<path d="M18 17V9"/>', '<path d="M13 17V5"/>', '<path d="M8 17v-3"/>'],
  },
  model: {
    label: "Model",
    order: 10,
    icon: [
      '<path d="M2 7.5 12 2l10 5.5-10 5.5z"/>',
      '<path d="M2 12.5 12 18l10-5.5"/>',
      '<path d="M2 17.5 12 23l10-5.5"/>',
    ],
  },
  project_page: {
    label: "Project Page",
    order: 11,
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
  return (
    paperResourceMeta[key] || {
      label: formatResourceLabel(key),
      order: 100,
      icon: paperResourceMeta.project_page.icon,
    }
  );
}

function createPaperResourceIcon(key) {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const meta = getPaperResourceMeta(key);

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

  count.className = "resource-count";
  count.setAttribute("aria-live", "polite");
  searchInput?.closest(".search-control")?.after(count);

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
    companies: getRowCompanyKeys(row),
    year: getRowYear(row),
  }));
  rows = fallbackRows;
  totalCount = rows.length;
  const countLabel =
    searchInput?.placeholder?.replace(/^Search\s+/i, "").trim().toLowerCase() || "items";
  const sortState = { column: "year", direction: "desc" };
  const dynamicColumns = Array.from(table?.querySelectorAll("thead th[data-field]") || []).map(
    (header) => ({
      field: header.dataset.field || "",
      isLink: header.dataset.linkField === "true" || header.dataset.field === "sourceUrl",
    })
  );

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
      currentPage = 1;
      applyState();
    } catch {
      rows = fallbackRows;
      totalCount = rows.length;
      currentPage = 1;
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

    count.textContent = `${totalCount.toLocaleString()} ${countLabel}`;
    updateSortHeaders();
    renderPager(matchingRows.length);
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

  initSortableHeaders();

  if (resourceSrc && dynamicColumns.length) {
    loadDynamicRows();
    return;
  }

  applyState();
}

document.querySelectorAll("[data-resource-list]").forEach(initResourceList);

function appendText(parent, text) {
  if (!hasResourceValue(text)) {
    return null;
  }

  const paragraph = document.createElement("p");
  paragraph.textContent = String(text);
  parent.append(paragraph);
  return paragraph;
}

function appendPaperLinks(parent, links) {
  const entries = Object.entries(links || {})
    .filter(([, value]) => isValidResourceUrl(value))
    .sort(([firstKey], [secondKey]) => {
      const firstMeta = getPaperResourceMeta(firstKey);
      const secondMeta = getPaperResourceMeta(secondKey);
      return firstMeta.order - secondMeta.order || firstKey.localeCompare(secondKey);
    });

  if (!entries.length) {
    return;
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

function renderPaperCard(container, data, images = []) {
  const article = document.createElement("article");
  const hero = document.createElement("header");
  const topbar = document.createElement("div");
  const meta = document.createElement("p");
  const closeLink = document.createElement("a");
  const title = document.createElement("h1");
  const body = document.createElement("div");
  const metaText = [data.venue, data.year].filter(hasResourceValue).join(" ");

  document.title = `${data.title || "Paper"} - GeoMind`;

  article.className = "paper-card-article";
  hero.className = "paper-card-hero";
  topbar.className = "paper-card-topbar";
  meta.className = "paper-card-meta";
  meta.textContent = metaText || "Paper";
  closeLink.className = "paper-card-close";
  closeLink.href = "papers.html";
  closeLink.setAttribute("aria-label", "Close paper card");
  closeLink.title = "Close";
  title.textContent = data.title || "Paper";
  topbar.append(meta, closeLink);
  hero.append(topbar, title);

  if (hasResourceValue(data.authors)) {
    const authors = document.createElement("p");
    authors.className = "paper-card-authors";
    authors.textContent = String(data.authors);
    hero.append(authors);
  }

  body.className = "paper-card-body";

  if (hasResourceValue(data.abstract) || hasResourceValue(images)) {
    const abstract = document.createElement("section");
    const heading = document.createElement("h2");

    abstract.className = "paper-card-section paper-card-abstract";
    heading.textContent = hasResourceValue(data.abstract) ? "Abstract" : "Images";
    abstract.append(heading);
    appendText(abstract, data.abstract);
    appendPaperImages(abstract, images, data.title);
    body.append(abstract);
  }

  if (hasResourceValue(data.links)) {
    const links = document.createElement("section");
    const linksHeading = document.createElement("h2");
    const linkList = document.createElement("div");

    links.className = "paper-card-section paper-card-resources";
    linksHeading.textContent = "Links";
    linkList.className = "paper-card-links";
    appendPaperLinks(linkList, data.links);
    links.append(linksHeading, linkList);
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
