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
    supp: "Supplement",
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
  let selectedItem = null;

  count.className = "resource-count";
  count.setAttribute("aria-live", "polite");
  searchInput?.closest(".search-control")?.after(count);

  pager.className = "table-pager";
  pager.setAttribute("aria-label", "Table pagination");
  pager.hidden = true;

  const detailPanel = document.createElement("section");
  detailPanel.className = "paper-detail-panel";
  detailPanel.hidden = true;

  if (isPaperList) {
    tableWrap?.after(detailPanel);
    detailPanel.after(pager);
  } else {
    tableWrap?.after(pager);
  }

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

  function createPagerButton(label, disabled, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.disabled = disabled;
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

  function appendDetailValue(parent, label, value) {
    if (!hasResourceValue(value)) {
      return;
    }

    const item = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    const wideLabels = new Set(["Abstract", "Links", "BibTeX", "Matched themes", "Borderline reason"]);

    term.textContent = label;
    if (wideLabels.has(label)) {
      item.className = "paper-detail-wide";
    }

    if (Array.isArray(value)) {
      const list = document.createElement("ul");

      list.className = "paper-detail-list";
      value.filter(hasResourceValue).forEach((entry) => {
        const listItem = document.createElement("li");
        listItem.textContent = String(entry);
        list.append(listItem);
      });
      description.append(list);
    } else if (typeof value === "object") {
      const linkList = document.createElement("ul");

      linkList.className = "paper-detail-links";
      Object.entries(value)
        .filter(([, entryValue]) => hasResourceValue(entryValue))
        .forEach(([key, entryValue]) => {
          const listItem = document.createElement("li");
          const entryText = String(entryValue);

          if (/^https?:\/\//i.test(entryText)) {
            const link = document.createElement("a");
            link.href = entryText;
            link.target = "_blank";
            link.rel = "noreferrer";
            link.textContent = formatResourceLabel(key);
            listItem.append(link);
          } else {
            listItem.textContent = `${formatResourceLabel(key)}: ${entryText}`;
          }

          linkList.append(listItem);
        });
      description.append(linkList);
    } else if (label === "BibTeX") {
      const code = document.createElement("code");
      const pre = document.createElement("pre");

      code.textContent = String(value);
      pre.append(code);
      description.append(pre);
    } else {
      description.textContent = String(value);
    }

    item.append(term, description);
    parent.append(item);
  }

  function renderPaperDetails(data) {
    if (!isPaperList || !data) {
      return;
    }

    const header = document.createElement("div");
    const eyebrow = document.createElement("p");
    const title = document.createElement("h2");
    const closeButton = document.createElement("button");
    const details = document.createElement("dl");
    const orderedFields = [
      "id",
      "title",
      "authors",
      "venue",
      "year",
      "presentation",
      "abstract",
      "links",
      "bibtex",
      "matched_themes",
      "borderline_reason",
    ];
    const seenFields = new Set(orderedFields);

    header.className = "paper-detail-header";
    eyebrow.className = "paper-detail-eyebrow";
    eyebrow.textContent = [data.venue, data.year].filter(hasResourceValue).join(" ");
    title.textContent = data.title || "Paper details";
    closeButton.type = "button";
    closeButton.textContent = "Close";
    closeButton.addEventListener("click", () => {
      selectedItem = null;
      detailPanel.hidden = true;
      rows.forEach(({ row }) => row?.classList.remove("is-selected"));
    });
    header.append(eyebrow, title, closeButton);

    details.className = "paper-detail-grid";
    orderedFields.forEach((field) => {
      appendDetailValue(details, formatResourceLabel(field), data[field]);
    });
    Object.entries(data)
      .filter(([field]) => !seenFields.has(field))
      .forEach(([field, value]) => {
        appendDetailValue(details, formatResourceLabel(field), value);
      });

    detailPanel.replaceChildren(header, details);
    detailPanel.hidden = false;
  }

  function selectPaper(item) {
    if (!isPaperList || !item?.item) {
      return;
    }

    selectedItem = item;
    rows.forEach(({ row }) => {
      row?.classList.toggle("is-selected", row === item.row);
    });
    renderPaperDetails(item.item);
    detailPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
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

    if (isPaperList) {
      row.tabIndex = 0;
      row.setAttribute("role", "button");
      row.setAttribute("aria-label", `Show details for ${data.title || "paper"}`);
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

    const previousButton = createPagerButton("Previous", currentPage === 1, () => {
      currentPage -= 1;
      applyState();
    });
    const nextButton = createPagerButton("Next", currentPage === totalPages, () => {
      currentPage += 1;
      applyState();
    });
    const status = document.createElement("span");

    status.textContent = `${currentPage} of ${totalPages}`;
    pager.append(previousButton, status, nextButton);
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
      if (isPaperList) {
        item.row.addEventListener("click", (event) => {
          if (event.target.closest("a, button")) {
            return;
          }

          selectPaper(item);
        });
        item.row.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") {
            return;
          }

          event.preventDefault();
          selectPaper(item);
        });
      }
      return item.row;
    });

    tableBody.replaceChildren(...visibleRows);
    if (isPaperList && selectedItem) {
      rows.forEach(({ row }) => {
        row?.classList.toggle("is-selected", row === selectedItem.row);
      });
    }

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

function appendPaperMeta(parent, label, value) {
  if (!hasResourceValue(value)) {
    return;
  }

  const item = document.createElement("div");
  const term = document.createElement("span");
  const detail = document.createElement("strong");

  term.textContent = label;

  if (Array.isArray(value)) {
    detail.textContent = value.filter(hasResourceValue).join(", ");
  } else {
    detail.textContent = String(value);
  }

  item.append(term, detail);
  parent.append(item);
}

function appendPaperLinks(parent, links) {
  const entries = Object.entries(links || {}).filter(([, value]) => hasResourceValue(value));

  if (!entries.length) {
    return;
  }

  entries.forEach(([key, value]) => {
    const link = document.createElement("a");
    link.href = String(value);
    link.textContent = formatResourceLabel(key);

    if (/^https?:\/\//i.test(link.href)) {
      link.target = "_blank";
      link.rel = "noreferrer";
    }

    parent.append(link);
  });
}

function appendPaperBibtex(parent, bibtex) {
  if (!hasResourceValue(bibtex)) {
    return;
  }

  const section = document.createElement("section");
  const heading = document.createElement("h2");
  const pre = document.createElement("pre");
  const code = document.createElement("code");

  section.className = "paper-card-bibtex";
  heading.textContent = "BibTeX";
  code.textContent = String(bibtex);
  pre.append(code);
  section.append(heading, pre);
  parent.append(section);
}

function renderPaperCard(container, data) {
  const article = document.createElement("article");
  const backLink = document.createElement("a");
  const hero = document.createElement("header");
  const meta = document.createElement("p");
  const title = document.createElement("h1");
  const body = document.createElement("div");
  const facts = document.createElement("section");
  const factsHeading = document.createElement("h2");
  const factGrid = document.createElement("div");
  const links = document.createElement("section");
  const linksHeading = document.createElement("h2");
  const linkList = document.createElement("div");
  const themes = document.createElement("section");
  const themesHeading = document.createElement("h2");
  const themeList = document.createElement("div");
  const metaText = [data.venue, data.year].filter(hasResourceValue).join(" ");

  document.title = `${data.title || "Paper"} - GeoMind`;

  article.className = "paper-card-article";
  backLink.className = "paper-card-back";
  backLink.href = "papers.html";
  backLink.textContent = "Back to papers";

  hero.className = "paper-card-hero";
  meta.className = "paper-card-meta";
  meta.textContent = metaText || "Paper";
  title.textContent = data.title || "Paper";
  hero.append(meta, title);
  appendText(hero, data.abstract);

  body.className = "paper-card-body";

  facts.className = "paper-card-section";
  factsHeading.textContent = "Metadata";
  factGrid.className = "paper-card-facts";
  appendPaperMeta(factGrid, "Authors", data.authors);
  appendPaperMeta(factGrid, "Venue", data.venue);
  appendPaperMeta(factGrid, "Year", data.year);
  appendPaperMeta(factGrid, "Presentation", data.presentation);
  appendPaperMeta(factGrid, "Paper ID", data.id);
  facts.append(factsHeading, factGrid);
  body.append(facts);

  if (hasResourceValue(data.links)) {
    links.className = "paper-card-section paper-card-resources";
    linksHeading.textContent = "Resources";
    linkList.className = "paper-card-links";
    appendPaperLinks(linkList, data.links);
    links.append(linksHeading, linkList);
    body.append(links);
  }

  if (hasResourceValue(data.matched_themes)) {
    themes.className = "paper-card-section";
    themesHeading.textContent = "Themes";
    themeList.className = "paper-card-themes";
    data.matched_themes.filter(hasResourceValue).forEach((theme) => {
      const item = document.createElement("span");
      item.textContent = String(theme);
      themeList.append(item);
    });
    themes.append(themesHeading, themeList);
    body.append(themes);
  }

  if (hasResourceValue(data.borderline_reason)) {
    const section = document.createElement("section");
    const heading = document.createElement("h2");

    section.className = "paper-card-section";
    heading.textContent = "Review note";
    section.append(heading);
    appendText(section, data.borderline_reason);
    body.append(section);
  }

  appendPaperBibtex(body, data.bibtex);
  article.append(backLink, hero, body);
  container.replaceChildren(article);
}

async function initPaperCardPage(container) {
  const source = container.dataset.paperSource || "../data/papers.json";
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

    if (!paper) {
      container.textContent = "Paper not found.";
      return;
    }

    renderPaperCard(container, paper);
  } catch {
    container.textContent = "Paper not found.";
  }
}

document.querySelectorAll("[data-paper-card]").forEach(initPaperCardPage);
