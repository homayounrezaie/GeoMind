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

function initResourceList(controls) {
  const section = controls.closest("section");
  const searchInput = controls.querySelector("[data-resource-search]");
  const venueFilter = controls.querySelector("[data-venue-filter]");
  const sortSelect = controls.querySelector("[data-sort-order]");
  const tableBody = section?.querySelector("tbody");
  const tableWrap = section?.querySelector(".resource-table-wrap");

  if (!section || !tableBody) {
    return;
  }

  const pageSize = Number(controls.dataset.pageSize || section.dataset.pageSize || 20);
  const pager = document.createElement("nav");
  const count = document.createElement("p");
  let currentPage = 1;

  count.className = "resource-count";
  count.setAttribute("aria-live", "polite");
  searchInput?.closest(".search-control")?.after(count);

  pager.className = "table-pager";
  pager.setAttribute("aria-label", "Table pagination");
  pager.hidden = true;
  tableWrap?.after(pager);

  const rows = Array.from(tableBody.querySelectorAll("tr")).map((row, index) => ({
    index,
    row,
    searchText: row.textContent.toLowerCase(),
    venue: row.dataset.venue || "",
    year: getRowYear(row),
  }));
  const totalCount = rows.length;
  const itemLabel =
    searchInput?.placeholder?.replace(/^Search\s+/i, "").trim().toLowerCase() || "items";

  function getSortOrder() {
    return sortSelect?.value || "new";
  }

  function createPagerButton(label, disabled, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.disabled = disabled;
    button.addEventListener("click", onClick);
    return button;
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
    const sortOrder = getSortOrder();

    const orderedRows = [...rows].sort((first, second) => {
      const yearDelta =
        sortOrder === "old" ? first.year - second.year : second.year - first.year;
      return yearDelta || first.index - second.index;
    });

    const matchingRows = orderedRows.filter((item) => {
      const matchesSearch = !query || item.searchText.includes(query);
      const matchesVenue = !selectedVenue || item.venue === selectedVenue;

      return matchesSearch && matchesVenue;
    });
    const isFiltered = Boolean(query || selectedVenue);
    const totalPages = Math.max(1, Math.ceil(matchingRows.length / pageSize));

    currentPage = Math.min(currentPage, totalPages);

    const pageStart = (currentPage - 1) * pageSize;
    const pageEnd = pageStart + pageSize;
    const visibleRows = new Set(matchingRows.slice(pageStart, pageEnd).map((item) => item.row));

    orderedRows.forEach((item) => {
      item.row.hidden = !visibleRows.has(item.row);
      tableBody.append(item.row);
    });

    count.textContent = isFiltered
      ? `Showing ${matchingRows.length.toLocaleString()} of ${totalCount.toLocaleString()} ${itemLabel}`
      : `Total: ${totalCount.toLocaleString()} ${itemLabel}`;
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

  sortSelect?.addEventListener("change", () => {
    currentPage = 1;
    applyState();
  });

  applyState();
}

document.querySelectorAll("[data-resource-list]").forEach(initResourceList);
