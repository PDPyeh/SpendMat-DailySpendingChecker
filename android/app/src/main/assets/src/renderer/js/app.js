(() => {
  const { SpendIcons: Icons, SpendFormat: Fmt } = window;

  const appState = {
    data: null,
    reminderStatus: null,
    notificationsSupported: true,
    activeView: 'desk',
    todayKey: Fmt.toDateKey(new Date()),
    selectedDate: Fmt.toDateKey(new Date()),
    archiveYear: new Date().getFullYear(),
    archiveMonth: new Date().getMonth(),
    archiveSearch: '',
    archiveCategory: 'ALL',
    dismissedBannerForDate: null,
    freshEntryId: null,
    lastDeletedEntry: null,
    toastTimer: null,
    lastTriggerFocus: null
  };

  const els = {
    deskPropsLayer: document.getElementById('desk-props-layer'),
    mainBinderClip: document.getElementById('main-binder-clip'),
    settingsBinderClip: document.getElementById('settings-binder-clip'),
    appLoading: document.getElementById('app-loading'),
    appError: document.getElementById('app-error'),
    appErrorTitle: document.getElementById('app-error-title'),
    appErrorDetail: document.getElementById('app-error-detail'),
    retryLoadBtn: document.getElementById('retry-load-btn'),
    mainWorkspace: document.getElementById('main-workspace'),

    tabs: Array.from(document.querySelectorAll('.folder-tab')),
    views: {
      desk: document.getElementById('view-desk'),
      archive: document.getElementById('view-archive'),
      settings: document.getElementById('view-settings')
    },

    quickCurrencySelect: document.getElementById('quick-currency-select'),
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    themeToggleIcon: document.getElementById('theme-toggle-icon'),
    themeToggleText: document.getElementById('theme-toggle-text'),

    nightAlertBanner: document.getElementById('night-alert-banner'),
    nightAlertTitle: document.getElementById('night-alert-title'),
    nightAlertDesc: document.getElementById('night-alert-desc'),
    alertFocusAddBtn: document.getElementById('alert-focus-add-btn'),
    alertNoSpendBtn: document.getElementById('alert-nospend-btn'),
    alertSnoozeBtn: document.getElementById('alert-snooze-btn'),
    alertDismissBtn: document.getElementById('alert-dismiss-btn'),

    prevDayBtn: document.getElementById('prev-day-btn'),
    nextDayBtn: document.getElementById('next-day-btn'),
    activeDateInput: document.getElementById('active-date-input'),
    activeDateLabel: document.getElementById('active-date-label'),
    jumpTodayBtn: document.getElementById('jump-today-btn'),
    dayTotalCaption: document.getElementById('day-total-caption'),
    dayTotalValue: document.getElementById('day-total-value'),
    dayEntryCount: document.getElementById('day-entry-count'),

    budgetStrip: document.getElementById('budget-strip'),
    budgetStripLabel: document.getElementById('budget-strip-label'),
    budgetStripStatus: document.getElementById('budget-strip-status'),
    budgetBarFill: document.getElementById('budget-bar-fill'),

    quickAddForm: document.getElementById('quick-add-form'),
    formCurrencyPrefix: document.getElementById('form-currency-prefix'),
    entryAmountInput: document.getElementById('entry-amount-input'),
    entryNoteInput: document.getElementById('entry-note-input'),
    entryCategorySelect: document.getElementById('entry-category-select'),
    formValidationMsg: document.getElementById('form-validation-msg'),

    todayEntriesList: document.getElementById('today-entries-list'),
    todayEmptyState: document.getElementById('today-empty-state'),
    todayEmptyTitle: document.getElementById('today-empty-title'),
    todayEmptyDesc: document.getElementById('today-empty-desc'),
    emptyStampNoSpendBtn: document.getElementById('empty-stamp-nospend-btn'),
    emptyUnstampBtn: document.getElementById('empty-unstamp-btn'),

    nightStatusPill: document.getElementById('night-status-pill'),
    nightStatusLabel: document.getElementById('night-status-label'),
    nightWatchHeadline: document.getElementById('night-watch-headline'),
    nightWatchDetail: document.getElementById('night-watch-detail'),
    quickReminderToggle: document.getElementById('quick-reminder-toggle'),
    quickReminderTime: document.getElementById('quick-reminder-time'),
    quickTestNotifBtn: document.getElementById('quick-test-notif-btn'),
    quickNotifFeedback: document.getElementById('quick-notif-feedback'),

    weekTotalBadge: document.getElementById('week-total-badge'),
    weekBarChart: document.getElementById('week-bar-chart'),
    weekAvgText: document.getElementById('week-avg-text'),

    prevMonthBtn: document.getElementById('prev-month-btn'),
    nextMonthBtn: document.getElementById('next-month-btn'),
    archiveMonthTitle: document.getElementById('archive-month-title'),
    archiveMonthTotal: document.getElementById('archive-month-total'),
    exportCsvBtn: document.getElementById('export-csv-btn'),
    archiveCalendarGrid: document.getElementById('archive-calendar-grid'),
    categoryBreakdownList: document.getElementById('category-breakdown-list'),
    categoryEmptyNote: document.getElementById('category-empty-note'),
    archiveSearchInput: document.getElementById('archive-search-input'),
    archiveCategoryFilter: document.getElementById('archive-category-filter'),
    archiveClearFiltersBtn: document.getElementById('archive-clear-filters-btn'),
    archiveHistoryTable: document.getElementById('archive-history-table'),
    archiveHistoryTbody: document.getElementById('archive-history-tbody'),
    archiveHistoryEmpty: document.getElementById('archive-history-empty'),
    archiveEmptyTitle: document.getElementById('archive-empty-title'),
    archiveEmptyDesc: document.getElementById('archive-empty-desc'),

    setReminderEnabled: document.getElementById('set-reminder-enabled'),
    setReminderTime: document.getElementById('set-reminder-time'),
    setRepeatInterval: document.getElementById('set-repeat-interval'),
    settingsTestNotifBtn: document.getElementById('settings-test-notif-btn'),
    settingsNotifStatus: document.getElementById('settings-notif-status'),
    setCurrencySelect: document.getElementById('set-currency-select'),
    setDailyBudget: document.getElementById('set-daily-budget'),
    saveBudgetBtn: document.getElementById('save-budget-btn'),
    clearBudgetBtn: document.getElementById('clear-budget-btn'),
    budgetValidationMsg: document.getElementById('budget-validation-msg'),
    setMinimizeTray: document.getElementById('set-minimize-tray'),
    setLaunchLogin: document.getElementById('set-launch-login'),
    setThemeSelect: document.getElementById('set-theme-select'),
    settingsPlatformHeading: document.getElementById('settings-platform-heading'),
    androidPermBtn: document.getElementById('android-perm-btn'),
    androidNotifPermDesc: document.getElementById('android-notif-perm-desc'),
    dataFilePathCode: document.getElementById('data-file-path-code'),
    openFolderBtn: document.getElementById('open-folder-btn'),
    exportBackupBtn: document.getElementById('export-backup-btn'),
    importBackupBtn: document.getElementById('import-backup-btn'),
    resetDataBtn: document.getElementById('reset-data-btn'),

    footerReminderChip: document.getElementById('footer-reminder-chip'),
    footerTrayChip: document.getElementById('footer-tray-chip'),

    toastBar: document.getElementById('toast-bar'),
    toastMessage: document.getElementById('toast-message'),
    toastUndoBtn: document.getElementById('toast-undo-btn'),

    editModalBackdrop: document.getElementById('edit-modal-backdrop'),
    editModalClose: document.getElementById('edit-modal-close'),
    editCancelBtn: document.getElementById('edit-cancel-btn'),
    editEntryForm: document.getElementById('edit-entry-form'),
    editEntryId: document.getElementById('edit-entry-id'),
    editEntryDate: document.getElementById('edit-entry-date'),
    editEntryAmount: document.getElementById('edit-entry-amount'),
    editEntryCategory: document.getElementById('edit-entry-category'),
    editEntryNote: document.getElementById('edit-entry-note'),
    editValidationMsg: document.getElementById('edit-validation-msg'),

    resetModalBackdrop: document.getElementById('reset-modal-backdrop'),
    resetCancelBtn: document.getElementById('reset-cancel-btn'),
    resetConfirmBtn: document.getElementById('reset-confirm-btn')
  };

  function mountStaticStationery() {
    els.deskPropsLayer.innerHTML = Icons.rulerCorner + Icons.pencilProp;
    els.mainBinderClip.innerHTML = Icons.binderClip;
    els.settingsBinderClip.innerHTML = Icons.binderClip;
    els.prevDayBtn.innerHTML = Icons.chevronLeft;
    els.nextDayBtn.innerHTML = Icons.chevronRight;
    els.prevMonthBtn.innerHTML = Icons.chevronLeft;
    els.nextMonthBtn.innerHTML = Icons.chevronRight;
  }

  function showToast(message, { undoEntry = null } = {}) {
    clearTimeout(appState.toastTimer);
    appState.lastDeletedEntry = undoEntry;
    els.toastMessage.textContent = message;
    els.toastUndoBtn.hidden = !undoEntry;
    els.toastBar.hidden = false;
    appState.toastTimer = setTimeout(() => {
      els.toastBar.hidden = true;
      appState.lastDeletedEntry = null;
    }, undoEntry ? 6500 : 3400);
  }

  function showError(title, detail) {
    els.appLoading.hidden = true;
    els.appErrorTitle.textContent = title;
    els.appErrorDetail.textContent = detail;
    els.appError.hidden = false;
  }

  function clearError() {
    els.appError.hidden = true;
  }

  function populateSelectOptions() {
    const { categories, currencyPresets } = appState.data;

    const fillSelect = (selectEl, items, includeAll = false) => {
      const current = selectEl.value;
      selectEl.innerHTML = '';
      if (includeAll) {
        const opt = document.createElement('option');
        opt.value = 'ALL';
        opt.textContent = 'All categories';
        selectEl.appendChild(opt);
      }
      items.forEach((cat) => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        selectEl.appendChild(opt);
      });
      if (current && Array.from(selectEl.options).some((o) => o.value === current)) {
        selectEl.value = current;
      }
    };

    fillSelect(els.entryCategorySelect, categories);
    fillSelect(els.editEntryCategory, categories);
    fillSelect(els.archiveCategoryFilter, categories, true);

    const fillCurrency = (selectEl) => {
      selectEl.innerHTML = '';
      currencyPresets.forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.code;
        opt.textContent = c.label;
        selectEl.appendChild(opt);
      });
    };

    fillCurrency(els.quickCurrencySelect);
    fillCurrency(els.setCurrencySelect);
  }

  function applyTheme(theme) {
    const mode = theme === 'night' ? 'night' : 'day';
    document.documentElement.setAttribute('data-theme', mode);
    if (mode === 'night') {
      els.themeToggleIcon.innerHTML = Icons.sun;
      els.themeToggleText.textContent = 'Day';
      els.themeToggleBtn.setAttribute('aria-label', 'Switch to Day Desk theme');
    } else {
      els.themeToggleIcon.innerHTML = Icons.moon;
      els.themeToggleText.textContent = 'Night';
      els.themeToggleBtn.setAttribute('aria-label', 'Switch to Night Desk theme');
    }
  }

  function switchView(viewName) {
    appState.activeView = viewName;
    els.tabs.forEach((tab) => {
      const active = tab.dataset.view === viewName;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    Object.entries(els.views).forEach(([name, panel]) => {
      const active = name === viewName;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });
    renderAll();
  }

  function renderNightAlertBanner() {
    const status = appState.reminderStatus;
    if (!status) {
      els.nightAlertBanner.hidden = true;
      return;
    }
    const isNeedsAction = (status.status === 'overdue' || status.status === 'notified') && !status.hasLoggedToday;
    const isDismissed = appState.dismissedBannerForDate === status.today;
    if (!isNeedsAction || isDismissed) {
      els.nightAlertBanner.hidden = true;
      return;
    }
    els.nightAlertTitle.textContent = `Past ${status.reminderTime}: nothing logged for today yet.`;
    els.nightAlertDesc.textContent = 'Add an expense on Today\'s Sheet or stamp today as a $0 no-spend day.';
    els.nightAlertBanner.hidden = false;
  }

  function renderDeskView() {
    const { entries, noSpendDays, settings } = appState.data;
    const dateKey = appState.selectedDate;
    const isToday = dateKey === appState.todayKey;

    els.activeDateInput.value = dateKey;
    els.activeDateLabel.textContent = Fmt.formatFriendlyDate(dateKey, appState.todayKey);
    els.jumpTodayBtn.hidden = isToday;
    els.formCurrencyPrefix.textContent = settings.currencySymbol;
    els.entryAmountInput.placeholder = settings.currencyDecimals === 0 ? '0' : '0.00';

    const dayEntries = entries.filter((e) => e.date === dateKey);
    const dayTotal = dayEntries.reduce((sum, item) => sum + item.amount, 0);
    const isStampedNoSpend = noSpendDays.includes(dateKey);

    els.dayTotalCaption.textContent = isToday ? "TODAY'S SPENDING" : 'DAY SPENDING';
    els.dayTotalValue.textContent = Fmt.formatCurrency(dayTotal, settings);
    if (isStampedNoSpend) {
      els.dayEntryCount.textContent = 'Stamped as $0 no-spend day';
    } else {
      els.dayEntryCount.textContent = `${dayEntries.length} ${dayEntries.length === 1 ? 'entry' : 'entries'}`;
    }

    // Optional daily budget ruler
    if (settings.dailyBudget && settings.dailyBudget > 0) {
      const pct = Math.min(100, Math.round((dayTotal / settings.dailyBudget) * 100));
      const diff = settings.dailyBudget - dayTotal;
      els.budgetStrip.hidden = false;
      els.budgetStripLabel.textContent = `Daily budget: ${Fmt.formatCurrency(settings.dailyBudget, settings)}`;
      if (diff >= 0) {
        els.budgetStripStatus.textContent = `${Fmt.formatCurrency(diff, settings)} remaining`;
        els.budgetBarFill.classList.remove('is-over');
      } else {
        els.budgetStripStatus.textContent = `${Fmt.formatCurrency(Math.abs(diff), settings)} over target`;
        els.budgetBarFill.classList.add('is-over');
      }
      els.budgetBarFill.style.width = `${pct}%`;
    } else {
      els.budgetStrip.hidden = true;
    }

    // Ledger list or empty state
    if (dayEntries.length === 0) {
      els.todayEntriesList.innerHTML = '';
      els.todayEntriesList.hidden = true;
      els.todayEmptyState.hidden = false;

      const existingStamp = els.todayEmptyState.querySelector('.nospend-stamp-banner');
      if (existingStamp) existingStamp.remove();

      if (isStampedNoSpend) {
        const stampEl = document.createElement('div');
        stampEl.className = 'nospend-stamp-banner';
        stampEl.innerHTML = `${Icons.checkStamp} <span>STAMPED: NO-SPEND DAY</span>`;
        els.todayEmptyState.prepend(stampEl);
        els.todayEmptyTitle.textContent = 'Zero spending confirmed for this day.';
        els.todayEmptyDesc.textContent = isToday
          ? "Tonight's automatic check sees you checked in and will stay quiet."
          : 'You stamped this date as a zero-spend day. Add an expense above anytime if you missed something.';
        els.emptyStampNoSpendBtn.hidden = true;
        els.emptyUnstampBtn.hidden = false;
      } else {
        els.todayEmptyTitle.textContent = isToday
          ? 'No spending logged for today yet.'
          : 'No spending logged for this date.';
        els.todayEmptyDesc.textContent = isToday
          ? "Enter an amount above to calculate your total, or stamp today as a zero-spend day so tonight's reminder skips you."
          : 'Add a missed expense above, or stamp this day as a zero-spend day.';
        els.emptyStampNoSpendBtn.hidden = false;
        els.emptyUnstampBtn.hidden = true;
      }
    } else {
      els.todayEntriesList.hidden = false;
      els.todayEmptyState.hidden = true;
      els.todayEntriesList.innerHTML = dayEntries
        .map((entry) => {
          const isFresh = entry.id === appState.freshEntryId;
          const noteLabel = entry.note ? Fmt.escapeHtml(entry.note) : Fmt.escapeHtml(entry.category);
          const timeText = Fmt.formatTime(entry.createdAt);
          return `
            <li class="ledger-row ${isFresh ? 'is-fresh' : ''}" data-entry-id="${Fmt.escapeHtml(entry.id)}">
              <span class="cat-tag">${Fmt.escapeHtml(entry.category)}</span>
              <div class="ledger-note-wrap">
                <span class="ledger-note">${noteLabel}</span>
                <span class="ledger-time">${timeText ? `Logged at ${timeText}` : ''}</span>
              </div>
              <span class="ledger-amount">${Fmt.escapeHtml(Fmt.formatCurrency(entry.amount, settings))}</span>
              <div class="row-actions">
                <button type="button" class="icon-action-btn" data-action="edit" data-id="${Fmt.escapeHtml(entry.id)}" aria-label="Edit ${noteLabel}" title="Edit entry">
                  ${Icons.edit}
                </button>
                <button type="button" class="icon-action-btn is-delete" data-action="delete" data-id="${Fmt.escapeHtml(entry.id)}" aria-label="Delete ${noteLabel}" title="Delete entry">
                  ${Icons.trash}
                </button>
              </div>
            </li>
          `;
        })
        .join('');
    }

    renderNightWatchCard();
    renderWeekChart();
  }

  function renderNightWatchCard() {
    const status = appState.reminderStatus;
    const { settings } = appState.data;
    if (!status) return;

    els.quickReminderToggle.checked = settings.reminderEnabled;
    els.quickReminderTime.value = settings.reminderTime;
    els.quickReminderTime.disabled = !settings.reminderEnabled;

    els.nightStatusPill.className = `real-state-tag state-${status.status}`;
    if (status.status === 'logged') {
      els.nightStatusLabel.textContent = 'Logged';
      els.nightWatchHeadline.textContent = 'All set for tonight';
      els.nightWatchDetail.textContent = status.isNoSpendDay
        ? 'Today is stamped as a $0 no-spend day. Your night alert will stay silent.'
        : `${status.entryCountToday} ${status.entryCountToday === 1 ? 'entry' : 'entries'} logged today. Your ${status.reminderTime} alert will stay silent.`;
    } else if (status.status === 'armed') {
      els.nightStatusLabel.textContent = 'Armed';
      els.nightWatchHeadline.textContent = `Checking tonight at ${status.reminderTime}`;
      els.nightWatchDetail.textContent = `Fires in ${Fmt.formatMinutesCountdown(status.minutesUntilTarget)} if today still has no spending entries or $0 stamp.`;
    } else if (status.status === 'snoozed') {
      els.nightStatusLabel.textContent = 'Snoozed';
      els.nightWatchHeadline.textContent = `Snoozed (${status.snoozeMinutesLeft}m left)`;
      els.nightWatchDetail.textContent = 'SpendMat will check again when the snooze ends unless you log today first.';
    } else if (status.status === 'overdue' || status.status === 'notified') {
      els.nightStatusLabel.textContent = 'Unlogged';
      els.nightWatchHeadline.textContent = `Past ${status.reminderTime}: waiting for input`;
      els.nightWatchDetail.textContent = 'Today has no spending entries yet. Log an expense or stamp a $0 no-spend day.';
    } else {
      els.nightStatusLabel.textContent = 'Paused';
      els.nightWatchHeadline.textContent = 'Night check is turned off';
      els.nightWatchDetail.textContent = 'Turn on automatic night checks to get notified on nights you forget to input.';
    }
  }

  function renderWeekChart() {
    const { entries, noSpendDays, settings } = appState.data;
    const days = Fmt.getLast7Days(appState.todayKey);
    const totals = days.map((d) => ({
      date: d,
      total: entries.filter((e) => e.date === d).reduce((s, e) => s + e.amount, 0),
      isNoSpend: noSpendDays.includes(d)
    }));

    const maxTotal = Math.max(...totals.map((d) => d.total), 0);
    const weekSum = totals.reduce((s, d) => s + d.total, 0);
    const avg = weekSum / 7;

    els.weekTotalBadge.textContent = Fmt.formatCurrency(weekSum, settings);
    els.weekAvgText.textContent = `Daily average: ${Fmt.formatCurrency(avg, settings)}`;

    els.weekBarChart.innerHTML = totals
      .map((item) => {
        const heightPct = maxTotal > 0 ? Math.max(item.total > 0 ? 14 : 4, Math.round((item.total / maxTotal) * 100)) : 4;
        const isSelected = item.date === appState.selectedDate;
        const classes = [
          'week-bar-btn',
          isSelected ? 'is-selected' : '',
          item.total === 0 && !item.isNoSpend ? 'is-empty' : '',
          item.isNoSpend ? 'is-nospend' : ''
        ]
          .filter(Boolean)
          .join(' ');
        const valText = item.isNoSpend ? '$0 stamped' : Fmt.formatCurrency(item.total, settings);
        const ariaText = `${Fmt.formatFriendlyDate(item.date, appState.todayKey)}: ${valText}`;
        return `
          <button type="button" class="${classes}" data-chart-date="${item.date}" title="${Fmt.escapeHtml(ariaText)}" aria-label="${Fmt.escapeHtml(ariaText)}">
            <div class="week-bar-column-wrap">
              <div class="week-bar-column" style="height: ${heightPct}%;"></div>
            </div>
            <span class="week-bar-day">${Fmt.formatShortWeekday(item.date).slice(0, 2)}</span>
          </button>
        `;
      })
      .join('');
  }

  function renderArchiveView() {
    const { entries, noSpendDays, settings } = appState.data;
    const year = appState.archiveYear;
    const month = appState.archiveMonth;
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}-`;

    els.archiveMonthTitle.textContent = Fmt.formatMonthTitle(year, month);

    const monthEntries = entries.filter((e) => e.date.startsWith(monthPrefix));
    const monthTotal = monthEntries.reduce((s, e) => s + e.amount, 0);
    els.archiveMonthTotal.textContent = Fmt.formatCurrency(monthTotal, settings);

    // Calendar grid
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daySums = {};
    monthEntries.forEach((e) => {
      daySums[e.date] = (daySums[e.date] || 0) + e.amount;
    });

    let calHtml = '';
    for (let blank = 0; blank < firstDay; blank += 1) {
      calHtml += '<div aria-hidden="true"></div>';
    }
    for (let d = 1; d <= daysInMonth; d += 1) {
      const dateKey = `${monthPrefix}${String(d).padStart(2, '0')}`;
      const sum = daySums[dateKey] || 0;
      const isNoSpend = noSpendDays.includes(dateKey);
      const isToday = dateKey === appState.todayKey;
      const isPastMissed = dateKey < appState.todayKey && sum === 0 && !isNoSpend;
      const cls = [
        'cal-day-btn',
        sum > 0 ? 'is-logged' : '',
        isNoSpend ? 'is-nospend' : '',
        isPastMissed ? 'is-missed' : '',
        isToday ? 'is-today' : ''
      ]
        .filter(Boolean)
        .join(' ');
      const shortVal = sum > 0 ? Fmt.formatCurrency(sum, settings) : isNoSpend ? '$0' : isPastMissed ? 'Missed' : '';
      calHtml += `
        <button type="button" class="${cls}" data-cal-date="${dateKey}" aria-label="${dateKey}: ${Fmt.escapeHtml(shortVal || 'No entries')}">
          <span class="cal-day-num">${d}</span>
          <span class="cal-day-val">${Fmt.escapeHtml(shortVal)}</span>
        </button>
      `;
    }
    els.archiveCalendarGrid.innerHTML = calHtml;

    // Category breakdown
    const catTotals = {};
    monthEntries.forEach((e) => {
      catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
    });
    const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    if (sortedCats.length === 0) {
      els.categoryBreakdownList.innerHTML = '';
      els.categoryEmptyNote.hidden = false;
    } else {
      els.categoryEmptyNote.hidden = true;
      els.categoryBreakdownList.innerHTML = sortedCats
        .map(([cat, amt]) => {
          const pct = monthTotal > 0 ? Math.round((amt / monthTotal) * 100) : 0;
          return `
            <div class="cat-bar-item">
              <div class="cat-bar-top">
                <span>${Fmt.escapeHtml(cat)} (${pct}%)</span>
                <span class="cat-bar-amount">${Fmt.escapeHtml(Fmt.formatCurrency(amt, settings))}</span>
              </div>
              <div class="cat-bar-track" aria-hidden="true">
                <div class="cat-bar-fill" style="width: ${pct}%;"></div>
              </div>
            </div>
          `;
        })
        .join('');
    }

    // Filtered history table
    const query = appState.archiveSearch.trim().toLowerCase();
    const catFilter = appState.archiveCategory;
    const hasFilters = Boolean(query) || catFilter !== 'ALL';
    els.archiveClearFiltersBtn.hidden = !hasFilters;

    const filtered = monthEntries
      .filter((e) => (catFilter === 'ALL' ? true : e.category === catFilter))
      .filter((e) => {
        if (!query) return true;
        return e.note.toLowerCase().includes(query) || e.category.toLowerCase().includes(query);
      })
      .sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)));

    if (filtered.length === 0) {
      els.archiveHistoryTable.hidden = true;
      els.archiveHistoryEmpty.hidden = false;
      if (hasFilters && monthEntries.length > 0) {
        els.archiveEmptyTitle.textContent = 'No entries match your search or category filter.';
        els.archiveEmptyDesc.textContent = 'Clear the filters above to view all entries for this month.';
      } else {
        els.archiveEmptyTitle.textContent = 'No spending recorded for this month yet.';
        els.archiveEmptyDesc.textContent = "Switch to Today's Sheet to log an expense.";
      }
    } else {
      els.archiveHistoryTable.hidden = false;
      els.archiveHistoryEmpty.hidden = true;
      els.archiveHistoryTbody.innerHTML = filtered
        .map((entry) => {
          const noteLabel = entry.note ? Fmt.escapeHtml(entry.note) : '<span class="ledger-time">No note</span>';
          return `
            <tr>
              <td><button type="button" class="btn btn-small btn-paper" data-cal-date="${entry.date}">${entry.date}</button></td>
              <td><span class="cat-tag">${Fmt.escapeHtml(entry.category)}</span></td>
              <td>${noteLabel}</td>
              <td class="col-amount">${Fmt.escapeHtml(Fmt.formatCurrency(entry.amount, settings))}</td>
              <td class="col-actions">
                <button type="button" class="icon-action-btn" data-action="edit" data-id="${Fmt.escapeHtml(entry.id)}" aria-label="Edit entry" title="Edit entry">${Icons.edit}</button>
                <button type="button" class="icon-action-btn is-delete" data-action="delete" data-id="${Fmt.escapeHtml(entry.id)}" aria-label="Delete entry" title="Delete entry">${Icons.trash}</button>
              </td>
            </tr>
          `;
        })
        .join('');
    }
  }

  function renderSettingsView() {
    const { settings, dataFilePath } = appState.data;
    const isAndroid = window.SpendPlatform === 'android';
    els.setReminderEnabled.checked = settings.reminderEnabled;
    els.setReminderTime.value = settings.reminderTime;
    els.setReminderTime.disabled = !settings.reminderEnabled;
    els.setRepeatInterval.value = String(settings.repeatEveryMinutes || 0);
    els.setRepeatInterval.disabled = !settings.reminderEnabled;
    els.setCurrencySelect.value = settings.currencyCode;
    els.setDailyBudget.value = settings.dailyBudget !== null ? String(settings.dailyBudget) : '';
    els.setMinimizeTray.checked = settings.minimizeToTray;
    els.setLaunchLogin.checked = settings.launchAtLogin;
    els.setThemeSelect.value = settings.theme;
    els.dataFilePathCode.textContent = dataFilePath || '';
    if (els.settingsPlatformHeading) {
      els.settingsPlatformHeading.textContent = isAndroid ? 'Android & Theme' : 'Windows Desktop & Theme';
    }
    if (els.settingsTestNotifBtn) {
      els.settingsTestNotifBtn.textContent = isAndroid ? 'Send Test Android Notification' : 'Send Test Windows Notification';
    }
    if (isAndroid && els.androidNotifPermDesc) {
      els.androidNotifPermDesc.textContent = appState.notificationsSupported
        ? 'Notifications are allowed. Android checks automatically at your night time even when SpendMat is closed.'
        : 'Notification permission is currently off. Tap Check Permission to enable nightly Android alerts.';
    }
  }

  function renderHeaderAndFooter() {
    const { settings } = appState.data;
    els.quickCurrencySelect.value = settings.currencyCode;
    applyTheme(settings.theme);

    els.footerReminderChip.textContent = settings.reminderEnabled
      ? `NIGHT CHECK: ${settings.reminderTime}`
      : 'NIGHT CHECK: PAUSED';
    els.footerTrayChip.textContent = settings.minimizeToTray ? 'TRAY: ON' : 'TRAY: OFF';
  }

  function renderAll() {
    if (!appState.data) return;
    appState.todayKey = Fmt.toDateKey(new Date());
    renderHeaderAndFooter();
    renderNightAlertBanner();
    renderDeskView();
    if (appState.activeView === 'archive') {
      renderArchiveView();
    } else if (appState.activeView === 'settings') {
      renderSettingsView();
    }
  }

  async function loadInitialState() {
    els.appLoading.hidden = false;
    els.appError.hidden = true;
    els.mainWorkspace.hidden = true;

    const res = await window.spendApi.getState();
    if (!res.ok) {
      showError('Could not load your spending notebook.', res.error);
      return;
    }

    appState.data = res.data.state;
    appState.reminderStatus = res.data.reminderStatus;
    appState.notificationsSupported = res.data.notificationsSupported;

    populateSelectOptions();
    els.appLoading.hidden = true;
    els.mainWorkspace.hidden = false;
    renderAll();

    if (res.data.loadWarning) {
      showError('Recovered from a damaged local file.', `SpendMat started with a clean sheet because the saved file had an error: ${res.data.loadWarning}`);
    }
  }

  async function applySettingsPatch(patch, feedbackMessage) {
    const res = await window.spendApi.updateSettings(patch);
    if (!res.ok) {
      showToast(res.error);
      return false;
    }
    appState.data = res.data.state;
    appState.reminderStatus = res.data.reminderStatus;
    renderAll();
    if (feedbackMessage) {
      showToast(feedbackMessage);
    }
    return true;
  }

  async function handleQuickAdd(event) {
    event.preventDefault();
    els.formValidationMsg.hidden = true;

    const rawAmount = els.entryAmountInput.value.trim();
    const numAmount = Number(rawAmount);
    if (!rawAmount || !Number.isFinite(numAmount) || numAmount <= 0) {
      els.formValidationMsg.textContent = 'Enter a spending amount greater than zero.';
      els.formValidationMsg.hidden = false;
      els.entryAmountInput.focus();
      return;
    }

    const res = await window.spendApi.addEntry({
      date: appState.selectedDate,
      amount: numAmount,
      category: els.entryCategorySelect.value,
      note: els.entryNoteInput.value.trim()
    });

    if (!res.ok) {
      els.formValidationMsg.textContent = res.error;
      els.formValidationMsg.hidden = false;
      return;
    }

    appState.data = res.data.state;
    appState.reminderStatus = res.data.reminderStatus;
    appState.freshEntryId = res.data.entry.id;
    els.entryAmountInput.value = '';
    els.entryNoteInput.value = '';
    renderAll();
    els.entryAmountInput.focus();
    showToast(`Added ${Fmt.formatCurrency(res.data.entry.amount, appState.data.settings)} to ${Fmt.formatFriendlyDate(appState.selectedDate, appState.todayKey)}.`);
  }

  async function handleToggleNoSpend(dateKey, forceValue) {
    const res = await window.spendApi.toggleNoSpendDay(dateKey, forceValue);
    if (!res.ok) {
      showToast(res.error);
      return;
    }
    appState.data = res.data.state;
    appState.reminderStatus = res.data.reminderStatus;
    renderAll();
    showToast(res.data.marked ? 'Stamped as a $0 no-spend day.' : 'Removed zero-spend stamp.');
  }

  async function handleDeleteEntry(id) {
    const existing = appState.data.entries.find((e) => e.id === id);
    if (!existing) return;

    const res = await window.spendApi.deleteEntry(id);
    if (!res.ok) {
      showToast(res.error);
      return;
    }
    appState.data = res.data.state;
    appState.reminderStatus = res.data.reminderStatus;
    renderAll();
    showToast(`Removed ${Fmt.formatCurrency(existing.amount, appState.data.settings)} entry.`, { undoEntry: existing });
  }

  function openEditModal(id, triggerEl) {
    const entry = appState.data.entries.find((e) => e.id === id);
    if (!entry) return;
    appState.lastTriggerFocus = triggerEl || document.activeElement;
    els.editEntryId.value = entry.id;
    els.editEntryDate.value = entry.date;
    els.editEntryAmount.value = String(entry.amount);
    els.editEntryCategory.value = entry.category;
    els.editEntryNote.value = entry.note;
    els.editValidationMsg.hidden = true;
    els.editModalBackdrop.hidden = false;
    els.editEntryAmount.focus();
  }

  function closeEditModal() {
    els.editModalBackdrop.hidden = true;
    if (appState.lastTriggerFocus && typeof appState.lastTriggerFocus.focus === 'function') {
      appState.lastTriggerFocus.focus();
    }
  }

  async function handleEditSubmit(event) {
    event.preventDefault();
    els.editValidationMsg.hidden = true;

    const id = els.editEntryId.value;
    const amount = Number(els.editEntryAmount.value);
    if (!Number.isFinite(amount) || amount <= 0) {
      els.editValidationMsg.textContent = 'Enter a valid amount greater than zero.';
      els.editValidationMsg.hidden = false;
      els.editEntryAmount.focus();
      return;
    }

    const res = await window.spendApi.updateEntry(id, {
      date: els.editEntryDate.value,
      amount,
      category: els.editEntryCategory.value,
      note: els.editEntryNote.value.trim()
    });

    if (!res.ok) {
      els.editValidationMsg.textContent = res.error;
      els.editValidationMsg.hidden = false;
      return;
    }

    appState.data = res.data.state;
    appState.reminderStatus = res.data.reminderStatus;
    closeEditModal();
    renderAll();
    showToast('Entry updated.');
  }

  function openResetModal(triggerEl) {
    appState.lastTriggerFocus = triggerEl || document.activeElement;
    els.resetModalBackdrop.hidden = false;
    els.resetCancelBtn.focus();
  }

  function closeResetModal() {
    els.resetModalBackdrop.hidden = true;
    if (appState.lastTriggerFocus && typeof appState.lastTriggerFocus.focus === 'function') {
      appState.lastTriggerFocus.focus();
    }
  }

  async function triggerTestNotification(targetFeedbackEl) {
    const isAndroid = window.SpendPlatform === 'android';
    targetFeedbackEl.hidden = false;
    targetFeedbackEl.textContent = isAndroid ? 'Sending Android notification...' : 'Sending Windows notification...';
    const res = await window.spendApi.testReminder();
    if (!res.ok) {
      targetFeedbackEl.textContent = res.error;
      return;
    }
    targetFeedbackEl.textContent = isAndroid
      ? 'Test notification sent. Check your Android status bar.'
      : 'Test notification sent. Check your Windows notification tray.';
  }

  function bindEvents() {
    els.retryLoadBtn.addEventListener('click', loadInitialState);

    els.tabs.forEach((tab) => {
      tab.addEventListener('click', () => switchView(tab.dataset.view));
    });

    els.quickCurrencySelect.addEventListener('change', (e) => {
      applySettingsPatch({ currencyCode: e.target.value }, `Currency switched to ${e.target.value}.`);
    });

    els.themeToggleBtn.addEventListener('click', () => {
      const nextTheme = appState.data.settings.theme === 'night' ? 'day' : 'night';
      applySettingsPatch({ theme: nextTheme });
    });

    // Night Alert Banner actions
    els.alertFocusAddBtn.addEventListener('click', () => {
      appState.selectedDate = appState.todayKey;
      switchView('desk');
      els.entryAmountInput.focus();
    });

    els.alertNoSpendBtn.addEventListener('click', () => {
      handleToggleNoSpend(appState.todayKey, true);
    });

    els.alertSnoozeBtn.addEventListener('click', async () => {
      const res = await window.spendApi.snoozeReminder(30);
      if (res.ok) {
        appState.data = res.data.state;
        appState.reminderStatus = res.data.reminderStatus;
        renderAll();
        showToast('Night reminder snoozed for 30 minutes.');
      }
    });

    els.alertDismissBtn.addEventListener('click', () => {
      appState.dismissedBannerForDate = appState.todayKey;
      els.nightAlertBanner.hidden = true;
    });

    // Day stepper & date picker
    els.prevDayBtn.addEventListener('click', () => {
      appState.selectedDate = Fmt.shiftDateKey(appState.selectedDate, -1);
      renderDeskView();
    });

    els.nextDayBtn.addEventListener('click', () => {
      appState.selectedDate = Fmt.shiftDateKey(appState.selectedDate, 1);
      renderDeskView();
    });

    els.activeDateInput.addEventListener('change', (e) => {
      if (e.target.value) {
        appState.selectedDate = e.target.value;
        renderDeskView();
      }
    });

    els.jumpTodayBtn.addEventListener('click', () => {
      appState.selectedDate = appState.todayKey;
      renderDeskView();
    });

    // Quick add & no-spend buttons
    els.quickAddForm.addEventListener('submit', handleQuickAdd);
    els.emptyStampNoSpendBtn.addEventListener('click', () => handleToggleNoSpend(appState.selectedDate, true));
    els.emptyUnstampBtn.addEventListener('click', () => handleToggleNoSpend(appState.selectedDate, false));

    // Delegated Edit / Delete on Today's Ledger & Archive Table
    const handleListClick = (event) => {
      const btn = event.target.closest('button[data-action]');
      if (!btn) return;
      const { action, id } = btn.dataset;
      if (action === 'edit') {
        openEditModal(id, btn);
      } else if (action === 'delete') {
        handleDeleteEntry(id);
      }
    };
    els.todayEntriesList.addEventListener('click', handleListClick);
    els.archiveHistoryTbody.addEventListener('click', (event) => {
      const dateBtn = event.target.closest('button[data-cal-date]');
      if (dateBtn) {
        appState.selectedDate = dateBtn.dataset.calDate;
        switchView('desk');
        return;
      }
      handleListClick(event);
    });

    // Quick Night Watch card controls
    els.quickReminderToggle.addEventListener('change', (e) => {
      applySettingsPatch(
        { reminderEnabled: e.target.checked },
        e.target.checked ? 'Automatic night check turned on.' : 'Automatic night check paused.'
      );
    });

    els.quickReminderTime.addEventListener('change', (e) => {
      if (e.target.value) {
        applySettingsPatch({ reminderTime: e.target.value }, `Night reminder set to ${e.target.value}.`);
      }
    });

    els.quickTestNotifBtn.addEventListener('click', () => triggerTestNotification(els.quickNotifFeedback));

    // 7-Day chart bar click
    els.weekBarChart.addEventListener('click', (event) => {
      const barBtn = event.target.closest('button[data-chart-date]');
      if (!barBtn) return;
      appState.selectedDate = barBtn.dataset.chartDate;
      renderDeskView();
    });

    // Archive controls
    els.prevMonthBtn.addEventListener('click', () => {
      if (appState.archiveMonth === 0) {
        appState.archiveMonth = 11;
        appState.archiveYear -= 1;
      } else {
        appState.archiveMonth -= 1;
      }
      renderArchiveView();
    });

    els.nextMonthBtn.addEventListener('click', () => {
      if (appState.archiveMonth === 11) {
        appState.archiveMonth = 0;
        appState.archiveYear += 1;
      } else {
        appState.archiveMonth += 1;
      }
      renderArchiveView();
    });

    els.archiveCalendarGrid.addEventListener('click', (event) => {
      const dayBtn = event.target.closest('button[data-cal-date]');
      if (!dayBtn) return;
      appState.selectedDate = dayBtn.dataset.calDate;
      switchView('desk');
    });

    els.archiveSearchInput.addEventListener('input', (e) => {
      appState.archiveSearch = e.target.value;
      renderArchiveView();
    });

    els.archiveCategoryFilter.addEventListener('change', (e) => {
      appState.archiveCategory = e.target.value;
      renderArchiveView();
    });

    els.archiveClearFiltersBtn.addEventListener('click', () => {
      appState.archiveSearch = '';
      appState.archiveCategory = 'ALL';
      els.archiveSearchInput.value = '';
      els.archiveCategoryFilter.value = 'ALL';
      renderArchiveView();
    });

    els.exportCsvBtn.addEventListener('click', async () => {
      const res = await window.spendApi.exportCsv();
      if (!res.ok) {
        showToast(res.error);
      } else if (!res.data.canceled) {
        showToast('CSV exported.');
      }
    });

    // Settings controls
    els.setReminderEnabled.addEventListener('change', (e) => {
      applySettingsPatch(
        { reminderEnabled: e.target.checked },
        e.target.checked ? 'Automatic night check enabled.' : 'Automatic night check paused.'
      );
    });

    els.setReminderTime.addEventListener('change', (e) => {
      if (e.target.value) {
        applySettingsPatch({ reminderTime: e.target.value }, `Night reminder time updated to ${e.target.value}.`);
      }
    });

    els.setRepeatInterval.addEventListener('change', (e) => {
      applySettingsPatch({ repeatEveryMinutes: Number(e.target.value) }, 'Repeat reminder rule saved.');
    });

    els.settingsTestNotifBtn.addEventListener('click', () => triggerTestNotification(els.settingsNotifStatus));

    els.setCurrencySelect.addEventListener('change', (e) => {
      applySettingsPatch({ currencyCode: e.target.value }, `Currency set to ${e.target.value}.`);
    });

    els.saveBudgetBtn.addEventListener('click', () => {
      els.budgetValidationMsg.hidden = true;
      const raw = els.setDailyBudget.value.trim();
      if (!raw) {
        applySettingsPatch({ dailyBudget: null }, 'Daily budget cleared.');
        return;
      }
      const val = Number(raw);
      if (!Number.isFinite(val) || val <= 0) {
        els.budgetValidationMsg.textContent = 'Enter a budget amount greater than zero, or click Clear.';
        els.budgetValidationMsg.hidden = false;
        return;
      }
      applySettingsPatch({ dailyBudget: val }, 'Daily budget saved.');
    });

    els.clearBudgetBtn.addEventListener('click', () => {
      els.budgetValidationMsg.hidden = true;
      els.setDailyBudget.value = '';
      applySettingsPatch({ dailyBudget: null }, 'Daily budget cleared.');
    });

    els.setMinimizeTray.addEventListener('change', (e) => {
      applySettingsPatch(
        { minimizeToTray: e.target.checked },
        e.target.checked ? 'Closing the window will keep SpendMat watching in your tray.' : 'Closing the window will exit SpendMat.'
      );
    });

    els.setLaunchLogin.addEventListener('change', (e) => {
      applySettingsPatch(
        { launchAtLogin: e.target.checked },
        e.target.checked ? 'SpendMat will start when Windows signs in.' : 'Windows startup launch disabled.'
      );
    });

    els.setThemeSelect.addEventListener('change', (e) => {
      applySettingsPatch({ theme: e.target.value }, `Switched to ${e.target.value === 'night' ? 'Night Desk' : 'Day Desk'}.`);
    });

    if (els.androidPermBtn) {
      els.androidPermBtn.addEventListener('click', async () => {
        if (!window.spendApi.requestNotificationPermission) return;
        const res = await window.spendApi.requestNotificationPermission();
        if (!res.ok) {
          showToast(res.error);
          return;
        }
        appState.notificationsSupported = Boolean(res.data.granted);
        renderSettingsView();
        showToast(res.data.granted ? 'Android notifications are enabled.' : 'Prompted for Android notification permission.');
      });
    }

    els.openFolderBtn.addEventListener('click', async () => {
      const res = await window.spendApi.openDataFolder();
      if (!res.ok) showToast(res.error);
    });

    els.exportBackupBtn.addEventListener('click', async () => {
      const res = await window.spendApi.exportBackup();
      if (!res.ok) {
        showToast(res.error);
      } else if (!res.data.canceled) {
        showToast('JSON backup saved.');
      }
    });

    els.importBackupBtn.addEventListener('click', async () => {
      const res = await window.spendApi.importBackup();
      if (!res.ok) {
        showToast(res.error);
      } else if (!res.data.canceled) {
        appState.data = res.data.state;
        appState.reminderStatus = res.data.reminderStatus;
        renderAll();
        showToast('Backup restored.');
      }
    });

    els.resetDataBtn.addEventListener('click', (e) => openResetModal(e.currentTarget));
    els.resetCancelBtn.addEventListener('click', closeResetModal);
    els.resetConfirmBtn.addEventListener('click', async () => {
      const res = await window.spendApi.resetAllData();
      closeResetModal();
      if (!res.ok) {
        showToast(res.error);
        return;
      }
      appState.data = res.data.state;
      appState.reminderStatus = res.data.reminderStatus;
      renderAll();
      showToast('All spending entries were cleared.');
    });

    // Toast Undo Delete
    els.toastUndoBtn.addEventListener('click', async () => {
      const deleted = appState.lastDeletedEntry;
      if (!deleted) return;
      appState.lastDeletedEntry = null;
      els.toastBar.hidden = true;
      const res = await window.spendApi.addEntry({
        date: deleted.date,
        amount: deleted.amount,
        category: deleted.category,
        note: deleted.note
      });
      if (res.ok) {
        appState.data = res.data.state;
        appState.reminderStatus = res.data.reminderStatus;
        renderAll();
        showToast('Deleted entry restored.');
      }
    });

    // Edit Modal controls
    els.editEntryForm.addEventListener('submit', handleEditSubmit);
    els.editModalClose.addEventListener('click', closeEditModal);
    els.editCancelBtn.addEventListener('click', closeEditModal);
    els.editModalBackdrop.addEventListener('click', (e) => {
      if (e.target === els.editModalBackdrop) closeEditModal();
    });
    els.resetModalBackdrop.addEventListener('click', (e) => {
      if (e.target === els.resetModalBackdrop) closeResetModal();
    });

    // Global Keyboard Accessibility (Escape closes modals, Ctrl+N focuses Quick Add)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!els.editModalBackdrop.hidden) {
          e.preventDefault();
          closeEditModal();
        } else if (!els.resetModalBackdrop.hidden) {
          e.preventDefault();
          closeResetModal();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        appState.selectedDate = appState.todayKey;
        switchView('desk');
        els.entryAmountInput.focus();
      }
    });

    // Main-process live events
    window.spendApi.onStateUpdated(({ state, reminderStatus }) => {
      appState.data = state;
      appState.reminderStatus = reminderStatus;
      clearError();
      renderAll();
    });

    window.spendApi.onReminderTriggered(({ isTest }) => {
      if (isTest) {
        showToast('Test Windows notification triggered.');
      } else {
        appState.dismissedBannerForDate = null;
        renderNightAlertBanner();
      }
    });

    window.spendApi.onFocusQuickAdd(() => {
      appState.selectedDate = appState.todayKey;
      switchView('desk');
      els.entryAmountInput.focus();
    });

    // Android hardware/gesture back navigation handler
    window.__handleAndroidBack = () => {
      if (!els.editModalBackdrop.hidden) {
        closeEditModal();
        return true;
      }
      if (!els.resetModalBackdrop.hidden) {
        closeResetModal();
        return true;
      }
      if (appState.activeView !== 'desk') {
        switchView('desk');
        return true;
      }
      return false;
    };
  }

  mountStaticStationery();
  bindEvents();
  loadInitialState();
})();
