/* ==========================================================
   省一点 · 交互原型逻辑
   数据保存在 localStorage，仅用于演示
   ========================================================== */

'use strict';

function dateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const NOW = new Date();
const TODAY = dateKey(NOW);
const MONTH = TODAY.slice(0, 7);
const YEAR = NOW.getFullYear();
const MONTH_NUM = NOW.getMonth() + 1;
const ELAPSED_DAYS = NOW.getDate();
const STORAGE_KEY = 'shengyidian.prototype.v4';
const LEGACY_STORAGE_KEY = 'shengyidian.prototype.v3';
const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

const CATS = {
  food:    { label: '餐饮', icon: 'bowl',   quick: '吃饭' },
  transit: { label: '交通', icon: 'train',  quick: '出行' },
  coffee:  { label: '咖啡', icon: 'coffee', quick: '咖啡' },
  shop:    { label: '购物', icon: 'bag',    quick: '购物' },
  fun:     { label: '娱乐', icon: 'film' },
  daily:   { label: '日用', icon: 'bottle' },
  gift:    { label: '人情', icon: 'gift' },
  other:   { label: '其他', icon: 'dots' }
};

const DEFAULT_TITLES = {
  food: '一餐',
  transit: '出行',
  coffee: '咖啡',
  shop: '购物',
  fun: '娱乐',
  daily: '日用',
  gift: '人情',
  other: '一笔支出'
};

const QUICK = [
  ['food', '吃饭'],
  ['transit', '出行'],
  ['coffee', '咖啡'],
  ['shop', '购物']
];

const FILTERS = [
  ['all', '全部'],
  ['food', '餐饮'],
  ['transit', '交通'],
  ['coffee', '咖啡'],
  ['shop', '购物'],
  ['want', '想要']
];

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function pad(n) {
  return String(n).padStart(2, '0');
}

function dateOffset(days) {
  const d = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + days);
  return dateKey(d);
}

function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function weekdayLabel(str) {
  return '周' + WEEK[parseDate(str).getDay()];
}

function dayLabel(str) {
  const d = parseDate(str);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function fmt(n) {
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function money(n) {
  return n < 0 ? `−¥${fmt(Math.abs(n))}` : `¥${fmt(n)}`;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function esc(str) {
  return String(str).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function ic(name, cls = '') {
  return `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
}

function mascot(name, cls = '') {
  return `<svg class="mascot ${cls}" viewBox="0 0 64 64" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
}

function uid() {
  return 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function sum(list) {
  return list.reduce((total, item) => total + item.amount, 0);
}

function daysCooling(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

/* ---------------- 演示数据 ---------------- */

function seedState() {
  const expenses = [];
  let seedId = 0;

  function add(date, time, cat, title, amount, want = false, note = '') {
    expenses.push({
      id: 'seed-' + (++seedId),
      date,
      time,
      cat,
      title,
      amount: Number(amount),
      want: Boolean(want),
      note,
      seq: 0
    });
  }

  // 10 月 1—20 日：有起伏的日常开销
  for (let d = 1; d <= 20; d++) {
    const date = `${MONTH}-${pad(d)}`;
    const lunch = 22 + ((d * 7) % 13);
    add(date, `12:${pad(8 + (d % 5) * 7)}`, 'food', '午餐', lunch);

    if (d % 2 === 1) {
      add(date, `08:${pad(5 + (d % 5))}`, 'food', '早餐', 6 + ((d * 3) % 5));
    }
    if (d % 3 === 0) {
      add(date, `15:${pad(4 + (d % 6) * 7)}`, 'coffee', '咖啡', 16 + ((d * 5) % 7), true, '下午有点困');
    }
    if (d % 5 === 0) {
      add(date, '19:20', 'daily', '超市采购', 54 + ((d * 3) % 36));
    }
    if (d % 6 === 0) {
      add(date, '20:10', 'fun', '电影', 38 + ((d % 3) * 10), true);
    }
    if (d % 4 === 0) {
      add(date, '18:40', 'food', '晚餐', 30 + ((d * 2) % 22));
    }
    if (d % 7 === 0) {
      add(date, '21:40', 'shop', '夜间下单', 45 + ((d * 3) % 28), true, '刷手机时买的');
    }
  }

  // 最近一周：刻意控制在日额度内，形成连续记录
  add('2026-10-21', '08:05', 'food', '早餐', 6, false, '豆浆饭团');
  add('2026-10-21', '12:20', 'food', '午餐', 24, false, '公司食堂');
  add('2026-10-21', '15:10', 'coffee', '美式', 18, true);

  add('2026-10-22', '12:15', 'food', '牛肉面', 26, false, '楼下小店');
  add('2026-10-22', '16:40', 'food', '水果', 16.5, false, '苹果和葡萄');
  add('2026-10-22', '18:30', 'transit', '地铁', 6, false);

  add('2026-10-23', '12:30', 'food', '午餐', 28, false);
  add('2026-10-23', '19:20', 'daily', '超市采购', 64.8, false, '周末囤货');

  add('2026-10-24', '12:05', 'food', '午餐', 28, false, '简餐');
  add('2026-10-24', '20:00', 'fun', '电影', 40, true, '晚场');

  add('2026-10-25', '12:10', 'food', '午餐', 22, false);
  add('2026-10-25', '15:00', 'coffee', '拿铁', 19, true);
  add('2026-10-25', '18:20', 'transit', '地铁', 12, false, '往返');
  add('2026-10-25', '21:30', 'food', '夜宵外卖', 45, true, '其实不饿');

  add('2026-10-26', '08:10', 'food', '早餐', 7, false, '包子豆浆');
  add('2026-10-26', '12:20', 'food', '午餐', 32, false, '和同事一起');
  add('2026-10-26', '17:50', 'food', '水果', 40, false, '一周的量');

  // 今天：60.50，留出一点余地
  add(TODAY, '08:12', 'food', '早餐', 8.5, false, '豆浆油条');
  add(TODAY, '08:45', 'transit', '地铁', 6, false, '2 号线 · 通勤');
  add(TODAY, '12:30', 'food', '午餐', 28, false, '公司楼下的轻食');
  add(TODAY, '15:06', 'coffee', '冰美式', 18, true, '下午提神');

  const now = Date.now();
  return {
    version: 3,
    monthBudget: 2800,
    dayBudget: 100,
    coolThreshold: 50,
    expenses,
    wishlist: [
      {
        id: 'w1',
        title: '机械键盘',
        amount: 499,
        cat: 'shop',
        note: '其实现在这个还能用',
        addedAt: new Date(now - 3 * 86400000).toISOString()
      },
      {
        id: 'w2',
        title: '秋冬外套',
        amount: 389,
        cat: 'shop',
        note: '衣柜里好像有类似的',
        addedAt: new Date(now - 2 * 86400000).toISOString()
      },
      {
        id: 'w3',
        title: '香薰蜡烛',
        amount: 129,
        cat: 'daily',
        note: '',
        addedAt: new Date(now - 1 * 86400000).toISOString()
      }
    ],
    savedAmount: 286,
    savedCount: 4,
    settings: { reminder: true, overspend: true }
  };
}

function freshState() {
  return {
    version: 4,
    monthBudget: 2800,
    dayBudget: 100,
    coolThreshold: 50,
    expenses: [],
    wishlist: [],
    savedAmount: 0,
    savedCount: 0,
    settings: { reminder: true, overspend: true }
  };
}

let storageMigrated = false;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 4 && Array.isArray(parsed.expenses)) {
        return parsed;
      }
      if (parsed && parsed.version === 3 && Array.isArray(parsed.expenses)) {
        // 从演示版升级：自动清掉 seed- 开头的演示账目，保留用户真正记过的账
        const realExpenses = parsed.expenses.filter(item => !String(item.id).startsWith('seed-'));
        const realWishlist = (parsed.wishlist || []).filter(item => !['w1', 'w2', 'w3'].includes(item.id));
        const base = freshState();
        base.monthBudget = Number(parsed.monthBudget) || base.monthBudget;
        base.dayBudget = Number(parsed.dayBudget) || base.dayBudget;
        base.coolThreshold = Number(parsed.coolThreshold) >= 0 ? Number(parsed.coolThreshold) : base.coolThreshold;
        base.expenses = realExpenses;
        base.wishlist = realWishlist;
        base.settings = parsed.settings || base.settings;
        storageMigrated = true;
        return base;
      }
    }
  } catch (err) {
    /* file:// 或隐私模式下 localStorage 可能不可用 */
  }
  return freshState();
}

let state = loadState();
let detailFilter = 'all';
let draft = { amount: '', cat: 'food', want: false, note: '', date: TODAY };
let pendingDraft = null;
let cooldownTimer = null;
let cooldownLeft = 10;
let toastTimer = null;
let resetArmed = false;
let resetTimer = null;

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    /* 忽略存储失败，原型仍可交互 */
  }
}

/* ---------------- 数据查询 ---------------- */

function monthExpenses() {
  return state.expenses.filter(item => item.date.startsWith(MONTH));
}

function todayExpenses() {
  return state.expenses.filter(item => item.date === TODAY);
}

function dayExpenses(date) {
  return state.expenses.filter(item => item.date === date);
}

function dayTotal(date) {
  return sum(dayExpenses(date));
}

function sortTx(a, b) {
  if ((b.seq || 0) !== (a.seq || 0)) return (b.seq || 0) - (a.seq || 0);
  return b.time.localeCompare(a.time);
}

function streakDays() {
  let streak = 0;
  for (let d = ELAPSED_DAYS; d >= 1; d--) {
    const date = `${MONTH}-${pad(d)}`;
    if (!dayExpenses(date).length) break;
    if (dayTotal(date) <= state.dayBudget) streak++;
    else break;
  }
  return streak;
}

function overBudgetDays() {
  let count = 0;
  for (let d = 1; d <= ELAPSED_DAYS; d++) {
    const date = `${MONTH}-${pad(d)}`;
    if (dayExpenses(date).length && dayTotal(date) > state.dayBudget) count++;
  }
  return count;
}

/* ---------------- 渲染：首页 ---------------- */

function renderHome() {
  const txs = todayExpenses().sort(sortTx);
  const total = sum(txs);
  const remain = state.dayBudget - total;
  const pct = state.dayBudget > 0 ? (total / state.dayBudget) * 100 : 0;
  const monthTotal = sum(monthExpenses());
  const monthRemain = state.monthBudget - monthTotal;
  const over = remain < 0;
  const streak = streakDays();

  $('#homeDate').textContent = `${dayLabel(TODAY)} · ${weekdayLabel(TODAY)}`;
  const hour = NOW.getHours();
  const salutation = hour < 11 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好';
  $('#homeGreeting').textContent = over
    ? '今天超了一点，明天慢一点'
    : txs.length
      ? `${salutation}，今天守住了`
      : `${salutation}，记下第一笔吧`;

  const hero = $('#hero');
  hero.classList.toggle('over', over);

  const badge = $('#heroBadge');
  badge.textContent = over ? `超出 ¥${fmt(-remain)}` : '预算内';
  badge.classList.toggle('over', over);

  $('#heroCap').textContent = over ? '今天已经超支' : '今天还能花';
  $('#heroAmount').textContent = fmt(Math.abs(remain));
  $('#heroSub').textContent = over
    ? `已花 ¥${fmt(total)} · 超出 ¥${fmt(-remain)}`
    : `已花 ¥${fmt(total)} / 预算 ¥${fmt(state.dayBudget)}`;

  $('#ringPct').textContent = `${Math.round(pct)}%`;
  $('#ringFg').style.strokeDashoffset = String(207.35 * (1 - clamp(pct, 0, 100) / 100));

  $('#heroMonth').textContent = money(monthRemain);
  $('#heroStreak').textContent = `${streak} 天`;

  $('#todayList').innerHTML = txs.length
    ? txs.map(txRow).join('')
    : `<div class="empty-state">${mascot('pig')}
         <div>今天还没有记账</div>
         <button class="empty-cta" data-empty-add>记第一笔</button>
       </div>`;
  $('#todayMeta').textContent = `${txs.length} 笔 · ¥${fmt(total)}`;

  const avg = txs.length ? total / txs.length : 0;
  const wantTotal = sum(txs.filter(item => item.want));
  const late = state.expenses.filter(item => item.date >= dateOffset(-6) && item.time >= '21:00');
  const lateTotal = sum(late);

  $('#homeInsight').innerHTML = !txs.length
    ? `<span class="insight-ic">${ic('sparkles')}</span>
       <span class="insight-copy"><b>今天还没有记账</b><p>点「+」补一笔，3 秒就好</p></span>
       ${ic('chevron-right')}`
    : lateTotal > 0
      ? `<span class="insight-ic">${ic('moon')}</span>
         <span class="insight-copy"><b>晚 9 点后花了 ¥${fmt(lateTotal)}</b><p>夜里最容易松手，这周留意一下</p></span>
         ${ic('chevron-right')}`
      : `<span class="insight-ic">${ic('sparkles')}</span>
         <span class="insight-copy"><b>今天平均每笔 ¥${fmt(avg)}</b><p>想要消费 ¥${fmt(wantTotal)} · 占 ${total ? Math.round(wantTotal / total * 100) : 0}%</p></span>
         ${ic('chevron-right')}`;
}

function txRow(item) {
  const cat = CATS[item.cat] || CATS.other;
  return `<button class="tx" data-txid="${item.id}">
    <span class="tx-ic tint-${item.cat}">${ic(cat.icon)}</span>
    <span class="tx-main">
      <span class="tx-title">${esc(item.title)}${item.want ? '<em class="tag-want">想要</em>' : ''}</span>
      <span class="tx-meta">${item.time} · ${cat.label}${item.note ? ' · ' + esc(item.note) : ''}</span>
    </span>
    <span class="tx-amt">−¥${fmt(item.amount)}</span>
  </button>`;
}

/* ---------------- 渲染：明细 ---------------- */

function renderDetail() {
  const all = monthExpenses();
  const total = sum(all);
  const remain = state.monthBudget - total;
  const recordedDays = new Set(all.map(item => item.date)).size;

  $('#detailCount').textContent = `共 ${all.length} 笔`;
  $('#detailMonthLabel').textContent = `${MONTH_NUM}月`;
  $('#detailTotal').textContent = fmt(total);
  $('#detailAvg').textContent = `¥${fmt(total / Math.max(1, ELAPSED_DAYS))}`;
  $('#detailRemain').textContent = money(remain);
  $('#detailDays').textContent = `${recordedDays} 天`;

  $('#filterChips').innerHTML = FILTERS.map(([key, label]) => {
    return `<button class="chip ${detailFilter === key ? 'active' : ''}" data-filter="${key}">${label}</button>`;
  }).join('');

  let list = all.slice();
  if (detailFilter === 'want') list = list.filter(item => item.want);
  else if (detailFilter !== 'all') list = list.filter(item => item.cat === detailFilter);

  const groups = {};
  list.forEach(item => {
    if (!groups[item.date]) groups[item.date] = [];
    groups[item.date].push(item);
  });

  const dates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
  if (!dates.length) {
    $('#detailGroups').innerHTML = `<div class="empty-state">${mascot('pig')}
      <div>这个筛选下还没有记录</div>
      <button class="empty-cta" data-empty-add>记第一笔</button>
    </div>`;
    return;
  }

  $('#detailGroups').innerHTML = dates.map(date => {
    const items = groups[date].sort(sortTx);
    const daySum = sum(items);
    const over = daySum > state.dayBudget;
    return `<section class="day-group">
      <div class="day-head">
        <b>${dayLabel(date)}</b>
        <span>${weekdayLabel(date)}</span>
        <span class="day-total">${items.length} 笔 · ¥${fmt(daySum)}${over ? '<em class="tag-over">超支</em>' : ''}</span>
      </div>
      <div class="tx-list">${items.map(txRow).join('')}</div>
    </section>`;
  }).join('');
}

/* ---------------- 渲染：统计 ---------------- */

function renderStats() {
  const all = monthExpenses();
  const total = sum(all);
  const count = all.length;
  const avg = total / Math.max(1, ELAPSED_DAYS);
  const remain = state.monthBudget - total;
  const usedPct = state.monthBudget > 0 ? total / state.monthBudget * 100 : 0;
  const overDays = overBudgetDays();

  $('#statsMonthPill').textContent = `${MONTH_NUM}月 · ${YEAR}`;

  if (!count) {
    $('#statsRoot').innerHTML = `<div class="empty-state" style="padding-top:60px;">
      ${mascot('pig')}
      <div>这个月还没有数据</div>
      <p style="margin:5px 0 0;font-size:10px;color:var(--muted-2);">记下第一笔，趋势才有意义</p>
      <button class="empty-cta" data-empty-add>记第一笔</button>
    </div>`;
    return;
  }

  const days = [];
  for (let i = 6; i >= 0; i--) days.push(dateOffset(-i));
  const values = days.map(dayTotal);
  const maxValue = Math.max(state.dayBudget, ...values, 1) * 1.12;
  const budgetPct = state.dayBudget / maxValue * 100;

  const bars = days.map((date, index) => {
    const value = values[index];
    const height = Math.max(2.5, value / maxValue * 100);
    const isToday = date === TODAY;
    const cls = value > state.dayBudget ? 'over' : (isToday ? 'today' : '');
    return `<div class="bar-col"><div class="bar ${cls}" style="height:${height}%" title="${dayLabel(date)} ¥${fmt(value)}"></div></div>`;
  }).join('');

  const dayLabels = days.map(date => {
    const d = parseDate(date);
    return `<span class="${date === TODAY ? 'today' : ''}">${d.getDate()}<b>${WEEK[d.getDay()]}</b></span>`;
  }).join('');

  const catTotals = Object.keys(CATS).map(key => ({
    key,
    label: CATS[key].label,
    icon: CATS[key].icon,
    amount: sum(all.filter(item => item.cat === key))
  })).filter(item => item.amount > 0).sort((a, b) => b.amount - a.amount).slice(0, 5);

  const catRows = catTotals.map(item => `
    <div class="cat-row">
      <span class="cat-ic-small tint-${item.key}">${ic(item.icon)}</span>
      <div class="cat-main">
        <div class="cat-name">${item.label}<span>${Math.round(item.amount / total * 100)}%</span></div>
        <div class="track"><i style="width:${Math.max(4, item.amount / total * 100)}%"></i></div>
      </div>
      <span class="cat-amount">¥${fmt(item.amount)}</span>
    </div>`).join('');

  const wantTotal = sum(all.filter(item => item.want));
  const wantRatio = total ? Math.round(wantTotal / total * 100) : 0;
  const lateTotal = sum(all.filter(item => item.time >= '21:00'));

  $('#statsRoot').innerHTML = `
    <section class="stats-total">
      <p class="label">本月支出</p>
      <div class="big"><span class="yen">¥</span>${fmt(total)}</div>
      <div class="meta-line">
        <span>日均 <b>¥${fmt(avg)}</b></span>
        <span>共 <b>${count}</b> 笔</span>
        <span>${remain >= 0 ? '结余' : '超出'} <b>${money(Math.abs(remain))}</b></span>
      </div>
      <div class="budget-track"><i class="${usedPct > 100 ? 'over' : ''}" style="width:${clamp(usedPct, 0, 100)}%"></i></div>
    </section>

    <section class="card chart-card">
      <div class="card-head"><h3>最近 7 天</h3><span>虚线 = 每日额度</span></div>
      <div class="chart-bars">
        <div class="budget-line" style="bottom:${budgetPct}%"><span>¥${state.dayBudget}</span></div>
        ${bars}
      </div>
      <div class="chart-days">${dayLabels}</div>
    </section>

    <section class="card cat-card">
      <div class="card-head"><h3>钱花在哪</h3><span>本月前 5 类</span></div>
      ${catRows}
    </section>

    <div class="want-card">
      <div class="donut" style="--want:${wantRatio}%">${mascot('pig')}</div>
      <div class="want-copy">
        <b><span class="ratio">${wantRatio}%</span>是「想要」</b>
        <p>本月为想要花了 ¥${fmt(wantTotal)}。先放一放，常常就没那么想要了。</p>
      </div>
    </div>

    <div class="split-card">
      <div class="split-cell">
        <p class="label">超支天数</p>
        <div class="value">${overDays}<span style="font-size:11px;color:var(--muted);font-weight:400;margin-left:2px;">天</span></div>
        <p>超过每日额度 ¥${state.dayBudget}</p>
      </div>
      <div class="split-cell">
        <p class="label">深夜消费</p>
        <div class="value"><span class="yen">¥</span>${fmt(lateTotal)}</div>
        <p>晚 9 点后的支出</p>
      </div>
    </div>
  `;
}

/* ---------------- 渲染：我的 ---------------- */

function renderMe() {
  const all = monthExpenses();
  const recordedDays = new Set(all.map(item => item.date)).size;
  const streak = streakDays();
  const wishlist = state.wishlist || [];

  $('#meRoot').innerHTML = `
    <header class="me-head">
      <div class="me-avatar">${mascot('pig')}</div>
      <div class="me-id">
        <p class="eyebrow">MY LEDGER</p>
        <h1>我的</h1>
        <p>${recordedDays ? `记录第 ${recordedDays} 天 · 共 ${all.length} 笔` : '还没有记账'}</p>
      </div>
      <span class="level-pill">${streak >= 7 ? '克制者' : all.length ? '记录中' : '开始记录'}</span>
    </header>

    <section class="saved-card">
      <p class="saved-kicker">本月守住的钱</p>
      <div class="saved-amount"><span>¥</span>${fmt(state.savedAmount)}</div>
      <p class="saved-sub">${state.savedCount} 次把冲动放回了口袋</p>
      <span class="saved-mascots">${mascot('turtle')}${mascot('pig')}</span>
    </section>

    <div class="section-head"><h2>预算</h2><span>随时可改</span></div>
    <div class="rows-card">
      <button class="row-btn" data-action="budget">
        <span class="row-ic">${ic('target')}</span>
        <span class="row-main"><b>月度预算</b><small>每天约 ¥${Math.round(state.monthBudget / 30)}</small></span>
        <span class="row-val">¥${fmt(state.monthBudget)} ${ic('chevron-right')}</span>
      </button>
      <button class="row-btn" data-action="budget">
        <span class="row-ic">${ic('wallet')}</span>
        <span class="row-main"><b>每日额度</b><small>首页的「今天还能花」</small></span>
        <span class="row-val">¥${fmt(state.dayBudget)} ${ic('chevron-right')}</span>
      </button>
      <button class="row-btn" data-action="budget">
        <span class="row-ic">${ic('shield')}</span>
        <span class="row-main"><b>冷静阈值</b><small>「想要」超过这个数先停 10 秒</small></span>
        <span class="row-val">¥${fmt(state.coolThreshold)} ${ic('chevron-right')}</span>
      </button>
    </div>

    <div class="section-head">
      <h2>冷静清单</h2>
      <span>${wishlist.length ? wishlist.length + ' 件 · 还没买' : '空空的'}</span>
    </div>
    <div class="wish-card">
      ${wishlist.length ? wishlist.map(wishRow).join('') : `
        <div class="wish-empty"><b>清单是空的</b>想买又犹豫的东西，先放进来。</div>`}
    </div>

    <div class="section-head"><h2>偏好</h2><span>本地设置</span></div>
    <div class="rows-card">
      <div class="settings-row">
        <span class="row-ic">${ic('bell')}</span>
        <span class="row-main"><b>每日提醒</b><small>21:30 提醒记一笔</small></span>
        <label class="switch"><input type="checkbox" data-setting="reminder" ${state.settings.reminder ? 'checked' : ''} /><i></i></label>
      </div>
      <div class="settings-row">
        <span class="row-ic">${ic('moon')}</span>
        <span class="row-main"><b>超支提醒</b><small>当天超过额度时轻轻提示</small></span>
        <label class="switch"><input type="checkbox" data-setting="overspend" ${state.settings.overspend ? 'checked' : ''} /><i></i></label>
      </div>
      <button class="settings-row" data-action="export">
        <span class="row-ic">${ic('download')}</span>
        <span class="row-main"><b>导出账单</b><small>CSV · 数据只保存在本机</small></span>
        ${ic('chevron-right')}
      </button>
      <button class="settings-row danger" data-action="reset" id="resetBtn">
        <span class="row-ic">${ic('trash')}</span>
        <span class="row-main"><b>清空账本</b><small>删除所有记录，保留预算设置</small></span>
        ${ic('chevron-right')}
      </button>
    </div>

    <p class="footnote">省一点 · v1.1 · 不上传任何数据</p>
  `;
}

function wishRow(item) {
  const cat = CATS[item.cat] || CATS.other;
  const days = daysCooling(item.addedAt);
  const cooled = days === 0 ? '今天加入' : `已冷静 ${days} 天`;
  return `<div class="wish">
    <div class="wish-top">
      <span class="wish-title">${esc(item.title)}</span>
      <span class="wish-amt">¥${fmt(item.amount)}</span>
    </div>
    <p class="wish-meta">${cat.label} · ${cooled}${item.note ? ' · ' + esc(item.note) : ''}</p>
    <div class="wish-actions">
      <button class="mini-btn" data-action="resist" data-id="${item.id}">放下了</button>
      <button class="mini-btn ghost" data-action="remove" data-id="${item.id}">移除</button>
    </div>
  </div>`;
}

function renderAll() {
  renderHome();
  renderDetail();
  renderStats();
  renderMe();
}

/* ---------------- 页面切换 ---------------- */

function go(name) {
  const valid = ['home', 'detail', 'stats', 'me'];
  if (!valid.includes(name)) name = 'home';
  $$('.screen').forEach(screen => {
    screen.classList.toggle('active', screen.dataset.screen === name);
  });
  $$('.tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.go === name);
  });
  if (name === 'detail') renderDetail();
  if (name === 'stats') renderStats();
  if (name === 'me') renderMe();
}

/* ---------------- 面板 ---------------- */

function openSheet(sheet) {
  $$('.sheet.open').forEach(el => {
    el.classList.remove('open');
    el.setAttribute('aria-hidden', 'true');
  });
  $('#overlay').classList.add('show');
  sheet.classList.add('open');
  sheet.setAttribute('aria-hidden', 'false');
  sheet.scrollTop = 0;
}

function closeSheets() {
  $('#overlay').classList.remove('show');
  $$('.sheet').forEach(sheet => {
    sheet.classList.remove('open');
    sheet.setAttribute('aria-hidden', 'true');
  });
}

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ---------------- 记一笔 ---------------- */

function openAdd(cat = 'food', presetWant = false) {
  draft = { amount: '', cat, want: presetWant, note: '', date: TODAY };
  const dateInput = $('#addDate');
  dateInput.min = `${MONTH}-01`;
  dateInput.max = TODAY;
  dateInput.value = TODAY;
  $('#addDateLabel').textContent = '今天';
  $('#noteInput').value = '';
  $('#noteInput').hidden = true;
  $('#noteToggle').hidden = false;
  updateAddUI();
  openSheet($('#addSheet'));
}

function formatInput(value) {
  if (!value) return '0';
  let str = value;
  if (str.startsWith('.')) str = '0' + str;
  const parts = str.split('.');
  parts[0] = parts[0].replace(/^0+(?=\d)/, '');
  parts[0] = Number(parts[0] || 0).toLocaleString('en-US');
  return parts.join('.');
}

function updateAddUI() {
  $('#amountText').textContent = formatInput(draft.amount);
  $('#addDateLabel').textContent = draft.date === TODAY ? '今天' : dayLabel(draft.date);
  $$('#wantSeg button').forEach(btn => {
    btn.classList.toggle('active', (btn.dataset.want === '1') === draft.want);
  });
  $('#typeHint').textContent = draft.want
    ? `超过 ¥${fmt(state.coolThreshold)} 时，会先请你冷静 10 秒。`
    : '生活必需，放心记。';
  $$('#catGrid .cat').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.cat === draft.cat);
  });
}

function renderCatGrid() {
  $('#catGrid').innerHTML = Object.entries(CATS).map(([key, cat]) => `
    <button type="button" class="cat" data-cat="${key}">
      <span class="cat-ic tint-${key}">${ic(cat.icon)}</span>
      <span>${cat.label}</span>
    </button>`).join('');
}

function inputKey(key) {
  if (key === 'del') {
    draft.amount = draft.amount.slice(0, -1);
    updateAddUI();
    return;
  }
  if (key === '.') {
    if (draft.amount.includes('.')) return;
    draft.amount = draft.amount ? draft.amount + '.' : '0.';
    updateAddUI();
    return;
  }
  if (draft.amount.includes('.')) {
    const decimals = draft.amount.split('.')[1] || '';
    if (decimals.length >= 2) return;
  }
  if (draft.amount.replace('.', '').length >= 6) return;
  if (draft.amount === '0') draft.amount = key;
  else draft.amount += key;
  updateAddUI();
}

function invalidAmount() {
  const display = $('#amountDisplay');
  display.classList.remove('shake');
  void display.offsetWidth;
  display.classList.add('shake');
  toast('先输入金额');
}

function submitAdd() {
  const amount = parseFloat(draft.amount);
  if (!amount || amount <= 0) {
    invalidAmount();
    return;
  }
  const payload = {
    cat: draft.cat,
    amount: Number(amount.toFixed(2)),
    want: draft.want,
    note: draft.note.trim(),
    date: draft.date || TODAY
  };
  if (payload.want && payload.amount >= state.coolThreshold) {
    startCooldown(payload);
    return;
  }
  commitExpense(payload);
}

function commitExpense(payload) {
  const now = new Date();
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const date = payload.date || TODAY;
  const note = payload.note || '';
  const title = note || DEFAULT_TITLES[payload.cat] || '一笔支出';
  state.expenses.push({
    id: uid(),
    date,
    time,
    cat: payload.cat,
    title,
    amount: payload.amount,
    want: payload.want,
    note: '',
    seq: Date.now()
  });
  persist();
  closeSheets();
  renderAll();
  go('home');
  if (date !== TODAY) {
    toast(`已补记到 ${dayLabel(date)} · ¥${fmt(payload.amount)}`);
    return;
  }
  const spent = sum(todayExpenses());
  const remain = state.dayBudget - spent;
  toast(remain >= 0
    ? `已记 ¥${fmt(payload.amount)} · 今天还剩 ¥${fmt(remain)}`
    : `已记 ¥${fmt(payload.amount)} · 今天超出 ¥${fmt(-remain)}`);
}

/* ---------------- 冷静期 ---------------- */

function startCooldown(payload) {
  pendingDraft = payload;
  const cat = CATS[payload.cat] || CATS.other;
  $('#cdTitle').textContent = payload.note || DEFAULT_TITLES[payload.cat];
  $('#cdAmount').textContent = `¥${fmt(payload.amount)}`;
  $('#cdMeta').textContent = `${cat.label} · 想要`;
  $('#cdHours').textContent = `≈ ${(payload.amount / 30).toFixed(1)} 小时的工作 · 按 ¥30/时`;
  $('#cdQuestion').innerHTML = '给自己 10 秒。<br />没有它，明天会有什么不同吗？';
  cooldownLeft = 10;
  updateCooldown();
  $('#cooldown').classList.add('show');
  $('#cooldown').setAttribute('aria-hidden', 'false');
  clearInterval(cooldownTimer);
  cooldownTimer = setInterval(() => {
    cooldownLeft -= 1;
    if (cooldownLeft <= 0) {
      clearInterval(cooldownTimer);
      cooldownLeft = 0;
      updateCooldown();
      $('#cdQuestion').innerHTML = '想清楚了吗？<br />决定权一直在你手里。';
    } else {
      updateCooldown();
    }
  }, 1000);
}

function updateCooldown() {
  $('#cdSeconds').textContent = cooldownLeft > 0 ? String(cooldownLeft) : '✓';
  $('#breathe').style.setProperty('--p', String((cooldownLeft / 10) * 100));
}

function hideCooldown() {
  clearInterval(cooldownTimer);
  $('#cooldown').classList.remove('show');
  $('#cooldown').setAttribute('aria-hidden', 'true');
  pendingDraft = null;
}

function cooldownResist() {
  if (!pendingDraft) return;
  state.savedAmount += pendingDraft.amount;
  state.savedCount += 1;
  const amount = pendingDraft.amount;
  persist();
  hideCooldown();
  closeSheets();
  renderAll();
  toast(`守住了 ¥${fmt(amount)}，记你一功`);
}

function cooldownLater() {
  if (!pendingDraft) return;
  const payload = pendingDraft;
  state.wishlist.unshift({
    id: uid(),
    title: payload.note || DEFAULT_TITLES[payload.cat],
    amount: payload.amount,
    cat: payload.cat,
    note: '',
    addedAt: new Date().toISOString()
  });
  persist();
  hideCooldown();
  closeSheets();
  renderAll();
  toast('已放进冷静清单，24 小时后再看');
}

function cooldownBuy() {
  if (!pendingDraft) return;
  const payload = pendingDraft;
  hideCooldown();
  closeSheets();
  commitExpense(payload);
}

/* ---------------- 预算 ---------------- */

function openBudget() {
  $('#monthlyInput').value = state.monthBudget;
  $('#dailyInput').value = state.dayBudget;
  $('#thresholdInput').value = state.coolThreshold;
  openSheet($('#budgetSheet'));
}

function saveBudget() {
  const monthly = parseFloat($('#monthlyInput').value);
  const daily = parseFloat($('#dailyInput').value);
  const threshold = parseFloat($('#thresholdInput').value);
  if (!monthly || monthly <= 0) {
    toast('月度预算要大于 0');
    return;
  }
  if (!daily || daily <= 0) {
    toast('每日额度要大于 0');
    return;
  }
  state.monthBudget = Number(monthly.toFixed(2));
  state.dayBudget = Number(daily.toFixed(2));
  state.coolThreshold = Number.isFinite(threshold) && threshold >= 0 ? Number(threshold.toFixed(2)) : 50;
  persist();
  closeSheets();
  renderAll();
  toast('预算已更新');
}

/* ---------------- 交易详情 ---------------- */

function openTxn(id) {
  const item = state.expenses.find(expense => expense.id === id);
  if (!item) return;
  const cat = CATS[item.cat] || CATS.other;
  $('#txnContent').innerHTML = `
    <div style="display:flex;justify-content:flex-end;">
      <button class="sheet-close" data-close aria-label="关闭">${ic('x')}</button>
    </div>
    <div class="txn-big-ic tint-${item.cat}">${ic(cat.icon)}</div>
    <h2>${esc(item.title)}</h2>
    <div class="txn-amount">−¥${fmt(item.amount)}</div>
    <p class="txn-meta">${dayLabel(item.date)} ${weekdayLabel(item.date)} · ${item.time} · ${cat.label}${item.want ? ' · 想要' : ''}</p>
    ${item.note ? `<p class="txn-meta" style="margin-top:-10px;">${esc(item.note)}</p>` : ''}
    <div class="txn-actions">
      <button class="btn btn-outline" data-delete="${item.id}">删除这笔</button>
      <button class="btn btn-soft" data-close>完成</button>
    </div>
  `;
  openSheet($('#txnSheet'));
}

/* ---------------- 导出 ---------------- */

function exportCSV() {
  const list = monthExpenses().slice().sort((a, b) => {
    return a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
  });
  const header = ['日期', '时间', '分类', '名称', '金额', '类型', '备注'];
  const rows = list.map(item => [
    item.date,
    item.time,
    (CATS[item.cat] || CATS.other).label,
    item.title,
    item.amount.toFixed(2),
    item.want ? '想要' : '需要',
    item.note || ''
  ]);
  const csv = '\uFEFF' + [header, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');

  try {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `省一点-账单-${MONTH}.csv`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      link.remove();
    }, 1000);
    toast('账单已导出');
  } catch (err) {
    toast('导出失败了，请换个浏览器试试');
  }
}

/* ---------------- 重置 ---------------- */

function handleReset(button) {
  if (!resetArmed) {
    resetArmed = true;
    button.classList.add('danger');
    const label = button.querySelector('b');
    if (label) label.textContent = '再点一次确认清空';
    resetTimer = setTimeout(() => {
      resetArmed = false;
      renderMe();
    }, 3200);
    return;
  }
  clearTimeout(resetTimer);
  resetArmed = false;
  state.expenses = [];
  state.wishlist = [];
  state.savedAmount = 0;
  state.savedCount = 0;
  persist();
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (err) { /* 忽略 */ }
  renderAll();
  go('home');
  toast('账本已清空，开始记自己的账');
}

/* ---------------- 事件绑定 ---------------- */

function bindEvents() {
  $$('.tab').forEach(tab => {
    tab.addEventListener('click', () => go(tab.dataset.go));
  });

  $('#addBtn').addEventListener('click', () => openAdd('food'));
  $('#avatarBtn').addEventListener('click', () => go('me'));

  $('#overlay').addEventListener('click', closeSheets);
  document.addEventListener('click', event => {
    if (event.target.closest('[data-close]')) closeSheets();
  });

  $('#quickRow').addEventListener('click', event => {
    const button = event.target.closest('[data-quick]');
    if (!button) return;
    const cat = button.dataset.quick;
    openAdd(cat, cat === 'shop' || cat === 'fun');
  });

  $('#todayList').addEventListener('click', event => {
    if (event.target.closest('[data-empty-add]')) {
      openAdd('food');
      return;
    }
    const button = event.target.closest('[data-txid]');
    if (button) openTxn(button.dataset.txid);
  });

  $('#homeInsight').addEventListener('click', () => go('stats'));
  $('#exportBtn').addEventListener('click', exportCSV);

  $('#filterChips').addEventListener('click', event => {
    const chip = event.target.closest('[data-filter]');
    if (!chip) return;
    detailFilter = chip.dataset.filter;
    renderDetail();
  });

  $('#detailGroups').addEventListener('click', event => {
    if (event.target.closest('[data-empty-add]')) {
      openAdd('food');
      return;
    }
    const button = event.target.closest('[data-txid]');
    if (button) openTxn(button.dataset.txid);
  });

  $('#statsRoot').addEventListener('click', event => {
    if (event.target.closest('[data-empty-add]')) openAdd('food');
  });

  $('#catGrid').addEventListener('click', event => {
    const button = event.target.closest('[data-cat]');
    if (!button) return;
    draft.cat = button.dataset.cat;
    updateAddUI();
  });

  $('#wantSeg').addEventListener('click', event => {
    const button = event.target.closest('[data-want]');
    if (!button) return;
    draft.want = button.dataset.want === '1';
    updateAddUI();
  });

  $('#noteInput').addEventListener('input', event => {
    draft.note = event.target.value;
  });

  $('#noteToggle').addEventListener('click', () => {
    const input = $('#noteInput');
    $('#noteToggle').hidden = true;
    input.hidden = false;
    input.focus();
  });

  $('#addDate').addEventListener('change', event => {
    if (event.target.value) {
      draft.date = event.target.value;
      updateAddUI();
    }
  });

  $('#keypad').addEventListener('click', event => {
    const key = event.target.closest('[data-key]');
    if (key) inputKey(key.dataset.key);
  });

  $('#saveBtn').addEventListener('click', submitAdd);

  $('#budgetSave').addEventListener('click', saveBudget);
  $('#suggestDaily').addEventListener('click', () => {
    const monthly = parseFloat($('#monthlyInput').value);
    if (monthly > 0) $('#dailyInput').value = Math.round(monthly / 30);
  });

  $('#meRoot').addEventListener('click', event => {
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    if (action === 'budget') {
      openBudget();
    } else if (action === 'resist') {
      const item = state.wishlist.find(wish => wish.id === actionEl.dataset.id);
      if (!item) return;
      state.savedAmount += item.amount;
      state.savedCount += 1;
      state.wishlist = state.wishlist.filter(wish => wish.id !== item.id);
      persist();
      renderAll();
      toast(`放下了 ¥${fmt(item.amount)}，又守住一笔`);
    } else if (action === 'remove') {
      state.wishlist = state.wishlist.filter(wish => wish.id !== actionEl.dataset.id);
      persist();
      renderMe();
      toast('已从清单移除');
    } else if (action === 'export') {
      exportCSV();
    } else if (action === 'reset') {
      handleReset(actionEl);
    }
  });

  $('#meRoot').addEventListener('change', event => {
    const input = event.target.closest('[data-setting]');
    if (!input) return;
    const key = input.dataset.setting;
    state.settings[key] = input.checked;
    persist();
    toast(input.checked ? '已开启提醒' : '已关闭提醒');
  });

  $('#txnContent').addEventListener('click', event => {
    const del = event.target.closest('[data-delete]');
    if (!del) return;
    state.expenses = state.expenses.filter(item => item.id !== del.dataset.delete);
    persist();
    closeSheets();
    renderAll();
    toast('已删除这笔');
  });

  $('#cdClose').addEventListener('click', hideCooldown);
  $('#cdLater').addEventListener('click', cooldownLater);
  $('#cdResist').addEventListener('click', cooldownResist);
  $('#cdBuy').addEventListener('click', cooldownBuy);

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if ($('#cooldown').classList.contains('show')) hideCooldown();
    else closeSheets();
  });
}

/* ---------------- 启动 ---------------- */

function boot() {
  const params = new URLSearchParams(location.search);
  if (params.get('reset') === '1') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch (err) { /* 忽略 */ }
    state = freshState();
  }

  renderCatGrid();
  bindEvents();
  renderAll();
  const clock = $('.statusbar .time');
  if (clock) clock.textContent = `${pad(NOW.getHours())}:${pad(NOW.getMinutes())}`;

  if (storageMigrated) {
    persist();
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch (err) { /* 忽略 */ }
    setTimeout(() => toast('演示账本已清理，可以开始记自己的账了'), 500);
  }

  const hash = location.hash.replace('#', '');
  go(['home', 'detail', 'stats', 'me'].includes(hash) ? hash : 'home');

  window.addEventListener('hashchange', () => {
    const next = location.hash.replace('#', '');
    if (['home', 'detail', 'stats', 'me'].includes(next)) go(next);
    if (next === 'add') setTimeout(() => openAdd('food'), 120);
  });

  if (hash === 'add') {
    setTimeout(() => openAdd('food'), 320);
  }

  if (params.get('demo') === 'cooldown') {
    setTimeout(() => {
      openAdd('shop', true);
      draft.amount = '499';
      draft.note = '机械键盘';
      draft.want = true;
      updateAddUI();
      startCooldown({ cat: 'shop', amount: 499, want: true, note: '机械键盘' });
    }, 420);
  }

  if (params.get('demo') === 'budget') {
    setTimeout(openBudget, 350);
  }

  if (params.get('debug') === '1') {
    const phone = $('#phone');
    document.body.setAttribute('data-debug', JSON.stringify({
      innerWidth,
      innerHeight,
      dpr: window.devicePixelRatio,
      phoneWidth: phone.offsetWidth,
      phoneLeft: phone.getBoundingClientRect().left,
      scrollWidth: document.documentElement.scrollWidth
    }));
  }

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
}

boot();
