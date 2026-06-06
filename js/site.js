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
  };

  return `View ${singularLabels[itemLabel] || "resource"} card`;
}

function decorateSourceLinks(table, cardLinkLabel) {
  table?.querySelectorAll("tbody td:last-child a").forEach((link) => {
    const source = getSourceKind(link);
    const icon = document.createElement("span");
    const text = document.createElement("span");

    link.classList.add("source-link");
    link.textContent = "";
    text.textContent = cardLinkLabel;

    if (source) {
      icon.className = `source-icon source-icon-${source.type}`;
      icon.setAttribute("aria-hidden", "true");
      link.setAttribute("aria-label", `${cardLinkLabel} on ${source.label}`);
      link.append(icon);
    }

    link.append(text);
  });
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

  if (!section || !tableBody) {
    return;
  }

  const pageSize = Number(controls.dataset.pageSize || section.dataset.pageSize || 20);
  const pager = document.createElement("nav");
  const count = document.createElement("p");
  const cardLinkLabel = getCardLinkLabel(searchInput);
  let currentPage = 1;

  count.className = "resource-count";
  count.setAttribute("aria-live", "polite");
  searchInput?.closest(".search-control")?.after(count);

  pager.className = "table-pager";
  pager.setAttribute("aria-label", "Table pagination");
  pager.hidden = true;
  tableWrap?.after(pager);

  decorateSourceLinks(table, cardLinkLabel);

  const rows = Array.from(tableBody.querySelectorAll("tr")).map((row, index) => ({
    index,
    row,
    name: row.cells[0]?.textContent.trim().toLowerCase() || "",
    searchText: row.textContent.toLowerCase(),
    venue: row.dataset.venue || "",
    companies: getRowCompanyKeys(row),
    year: getRowYear(row),
  }));
  const totalCount = rows.length;
  const itemLabel =
    searchInput?.placeholder?.replace(/^Search\s+/i, "").trim().toLowerCase() || "items";

  const sortState = { column: "year", direction: "desc" };

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
    const isFiltered = Boolean(query || selectedVenue || selectedCompany !== "all");
    const totalPages = Math.max(1, Math.ceil(matchingRows.length / pageSize));

    currentPage = Math.min(currentPage, totalPages);

    const pageStart = (currentPage - 1) * pageSize;
    const pageEnd = pageStart + pageSize;
    const visibleRows = matchingRows.slice(pageStart, pageEnd).map((item) => item.row);

    tableBody.replaceChildren(...visibleRows);

    count.textContent = isFiltered
      ? `Showing ${matchingRows.length.toLocaleString()} of ${totalCount.toLocaleString()} ${itemLabel}`
      : `Total: ${totalCount.toLocaleString()} ${itemLabel}`;
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
  applyState();
}

document.querySelectorAll("[data-resource-list]").forEach(initResourceList);
