window.SpendFormat = (() => {
  function toDateKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function parseDateKey(dateKey) {
    const [y, m, d] = dateKey.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function shiftDateKey(dateKey, daysDelta) {
    const d = parseDateKey(dateKey);
    d.setDate(d.getDate() + daysDelta);
    return toDateKey(d);
  }

  function formatFriendlyDate(dateKey, todayKey) {
    const d = parseDateKey(dateKey);
    const label = d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    if (dateKey === todayKey) {
      return `Today, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    if (dateKey === shiftDateKey(todayKey, -1)) {
      return `Yesterday, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    return label;
  }

  function formatShortWeekday(dateKey) {
    const d = parseDateKey(dateKey);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  }

  function formatShortDayNum(dateKey) {
    return dateKey.slice(8, 10).replace(/^0/, '');
  }

  function formatMonthTitle(year, monthIndex) {
    const d = new Date(year, monthIndex, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  function formatTime(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  function formatCurrency(amount, settings) {
    const num = Number(amount || 0);
    const decimals = Number.isInteger(settings?.currencyDecimals) ? settings.currencyDecimals : 2;
    const symbol = settings?.currencySymbol || '$';
    const formatted = num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    if (symbol.length > 1) {
      return `${symbol} ${formatted}`;
    }
    return `${symbol}${formatted}`;
  }

  function formatMinutesCountdown(totalMinutes) {
    const mins = Math.max(0, Math.round(totalMinutes));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) {
      return `${m}m`;
    }
    if (m === 0) {
      return `${h}h`;
    }
    return `${h}h ${m}m`;
  }

  function getLast7Days(anchorDateKey) {
    const days = [];
    for (let i = 6; i >= 0; i -= 1) {
      days.push(shiftDateKey(anchorDateKey, -i));
    }
    return days;
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  return {
    toDateKey,
    parseDateKey,
    shiftDateKey,
    formatFriendlyDate,
    formatShortWeekday,
    formatShortDayNum,
    formatMonthTitle,
    formatTime,
    formatCurrency,
    formatMinutesCountdown,
    getLast7Days,
    escapeHtml
  };
})();
