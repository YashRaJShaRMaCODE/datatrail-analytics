(() => {
  'use strict';

  function matchesDatasetNote(project, filter) {
    if (filter === 'small') return project.dataset.rows !== null && project.dataset.rows < 30;
    if (filter === 'unmatched') return project.dataset.rows === null;
    if (filter === 'review') return project.dataset.rows === null || project.dataset.raggedRows > 0;
    return true;
  }

  function sortProjects(projects, sort) {
    if (!sort) return projects;
    return [...projects].sort((a, b) => {
      if (sort === 'largest' || sort === 'smallest') {
        const aRows = a.dataset.rows;
        const bRows = b.dataset.rows;
        if (aRows === null && bRows !== null) return 1;
        if (bRows === null && aRows !== null) return -1;
        const difference = (aRows ?? 0) - (bRows ?? 0);
        if (difference) return sort === 'largest' ? -difference : difference;
      }
      return a.title.localeCompare(b.title);
    });
  }

  function mergeSavedSlugs(current, backup, validSlugs) {
    if (!backup || backup.format !== 'data-fieldnotes-reading-list' || backup.version !== 1 || !Array.isArray(backup.slugs)) return null;
    const allowed = new Set(validSlugs);
    return [...new Set([
      ...current.filter(slug => allowed.has(slug)),
      ...backup.slugs.filter(slug => typeof slug === 'string' && allowed.has(slug)),
    ])];
  }

  window.CasebookLogic = Object.freeze({ matchesDatasetNote, sortProjects, mergeSavedSlugs });
})();
