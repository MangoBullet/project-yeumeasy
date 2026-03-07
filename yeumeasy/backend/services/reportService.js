const { Op } = require('sequelize');
const { Borrow, BorrowDetail, Equipment, User } = require('../models');

function buildError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function normalizeDate(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function monthName(month) {
  const names = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  return names[month - 1];
}

function parsePositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function parseMonthYearQuery(query = {}) {
  // Support both:
  // 1) month=3&year=2025
  // 2) month=2025-03
  const monthRaw = (query.month || '').toString().trim();
  const yearRaw = query.year;

  if (/^\d{4}-\d{2}$/.test(monthRaw)) {
    const [yearPart, monthPart] = monthRaw.split('-').map(Number);
    return { month: monthPart, year: yearPart };
  }

  return {
    month: parsePositiveInt(monthRaw, new Date().getUTCMonth() + 1),
    year: parsePositiveInt(yearRaw, new Date().getUTCFullYear())
  };
}

function mapBorrowRow(detail) {
  const borrow = detail.borrow;
  const user = borrow && borrow.user ? borrow.user.full_name : null;
  const equipment = detail.equipment ? detail.equipment.equipment_name : null;
  const borrowDate = borrow ? borrow.borrow_date : null;
  const returnDate =
    borrow && borrow.borrow_status === 'returned'
      ? normalizeDate(borrow.updatedAt)
      : borrow
      ? borrow.due_date
      : null;

  return {
    user,
    equipment,
    quantity: Number(detail.amount || 0),
    borrowDate,
    startDate: borrowDate,
    returnDate,
    status: borrow && borrow.borrow_status === 'returned' ? 'returned' : 'borrowed'
  };
}

function buildBorrowAggregations(rows) {
  const byDay = {};
  const byMonth = {};
  const equipmentStats = {};
  let totalBorrowedToday = 0;
  let totalBorrowedThisMonth = 0;

  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);

  for (const row of rows) {
    const qty = Number(row.quantity || 0);
    const dayKey = row.borrowDate;
    const monthKey = dayKey.slice(0, 7);
    const equipmentKey = row.equipment || 'Unknown';

    byDay[dayKey] = byDay[dayKey] || {
      date: dayKey,
      borrowCount: 0,
      totalQuantity: 0
    };
    byDay[dayKey].borrowCount += 1;
    byDay[dayKey].totalQuantity += qty;

    byMonth[monthKey] = byMonth[monthKey] || {
      month: monthKey,
      borrowCount: 0,
      totalQuantity: 0
    };
    byMonth[monthKey].borrowCount += 1;
    byMonth[monthKey].totalQuantity += qty;

    equipmentStats[equipmentKey] = equipmentStats[equipmentKey] || {
      equipment: equipmentKey,
      borrowCount: 0,
      totalQuantity: 0
    };
    equipmentStats[equipmentKey].borrowCount += 1;
    equipmentStats[equipmentKey].totalQuantity += qty;

    if (dayKey === today) totalBorrowedToday += qty;
    if (monthKey === currentMonth) totalBorrowedThisMonth += qty;
  }

  const mostBorrowedEquipment = Object.values(equipmentStats).sort(
    (a, b) => b.totalQuantity - a.totalQuantity || b.borrowCount - a.borrowCount
  )[0] || { equipment: null, borrowCount: 0, totalQuantity: 0 };

  return {
    dailyData: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
    monthlyData: Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month)),
    summary: {
      totalBorrowedToday,
      totalBorrowedThisMonth,
      mostBorrowedEquipment
    }
  };
}

exports.getBorrowReport = async (query = {}) => {
  const startDate = query.startDate || null;
  const endDate = query.endDate || null;
  const search = (query.search || '').trim().toLowerCase();
  const page = parsePositiveInt(query.page, 1);
  const limit = parsePositiveInt(query.limit, 10);

  if (startDate && !isValidDateString(startDate)) {
    throw buildError('Invalid startDate format. Use YYYY-MM-DD');
  }

  if (endDate && !isValidDateString(endDate)) {
    throw buildError('Invalid endDate format. Use YYYY-MM-DD');
  }

  if (startDate && endDate && startDate > endDate) {
    throw buildError('startDate must be less than or equal to endDate');
  }

  const borrowWhere = {};
  if (startDate || endDate) {
    borrowWhere.borrow_date = {};
    if (startDate) borrowWhere.borrow_date[Op.gte] = startDate;
    if (endDate) borrowWhere.borrow_date[Op.lte] = endDate;
  }

  const rows = await BorrowDetail.findAll({
    include: [
      {
        model: Borrow,
        as: 'borrow',
        required: true,
        where: borrowWhere,
        include: [{ model: User, as: 'user', attributes: ['id', 'full_name'] }]
      },
      { model: Equipment, as: 'equipment', attributes: ['id', 'equipment_name'] }
    ],
    order: [[{ model: Borrow, as: 'borrow' }, 'borrow_date', 'DESC'], ['id', 'DESC']]
  });

  let mappedRows = rows.map(mapBorrowRow);

  if (search) {
    mappedRows = mappedRows.filter((item) => {
      const values = [
        item.user,
        item.equipment,
        item.status,
        item.borrowDate,
        item.startDate,
        item.returnDate
      ];
      return values.some((value) => String(value || '').toLowerCase().includes(search));
    });
  }

  const totalItems = mappedRows.length;
  const totalPages = Math.max(Math.ceil(totalItems / limit), 1);
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * limit;
  const data = mappedRows.slice(startIndex, startIndex + limit);

  const { dailyData, monthlyData, summary } = buildBorrowAggregations(mappedRows);

  return {
    data,
    dailyData,
    monthlyData,
    summary,
    pagination: {
      totalItems,
      totalPages,
      currentPage,
      limit
    }
  };
};

exports.getTopEquipmentReport = async (query = {}) => {
  const { month, year } = parseMonthYearQuery(query);
  const search = (query.search || '').trim().toLowerCase();
  const page = parsePositiveInt(query.page, 1);
  const limit = parsePositiveInt(query.limit, 10);

  if (month < 1 || month > 12) {
    throw buildError('Invalid month. Use a value from 1 to 12');
  }

  if (year < 1900 || year > 9999) {
    throw buildError('Invalid year value');
  }

  const start = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-01`;
  const lastDate = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const end = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(
    lastDate
  ).padStart(2, '0')}`;

  const rows = await BorrowDetail.findAll({
    include: [
      {
        model: Borrow,
        as: 'borrow',
        required: true,
        where: {
          borrow_date: {
            [Op.gte]: start,
            [Op.lte]: end
          }
        },
        attributes: ['id']
      },
      {
        model: Equipment,
        as: 'equipment',
        required: true,
        attributes: ['id', 'equipment_name']
      }
    ]
  });

  const stats = {};
  for (const row of rows) {
    const key = row.equipment.equipment_name;
    if (!stats[key]) {
      stats[key] = {
        equipment: key,
        borrowCount: 0,
        totalQuantity: 0
      };
    }
    stats[key].borrowCount += 1;
    stats[key].totalQuantity += Number(row.amount || 0);
  }

  let data = Object.values(stats).sort(
    (a, b) => b.totalQuantity - a.totalQuantity || b.borrowCount - a.borrowCount
  );

  if (search) {
    data = data.filter((item) => item.equipment.toLowerCase().includes(search));
  }

  const totalItems = data.length;
  const totalPages = Math.max(Math.ceil(totalItems / limit), 1);
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * limit;
  const pagedData = data.slice(startIndex, startIndex + limit);

  const legacyTopEquipment = pagedData.map((item) => ({
    equipment_name: item.equipment,
    totalTimes: item.borrowCount,
    totalQuantity: item.totalQuantity
  }));

  return {
    month: monthName(month),
    year,
    data: pagedData,
    // Backward-compatible payload for existing EJS report page
    topEquipment: legacyTopEquipment,
    summary: {
      totalUniqueEquipment: totalItems,
      totalBorrowCount: data.reduce((sum, item) => sum + item.borrowCount, 0),
      totalQuantityBorrowed: data.reduce((sum, item) => sum + item.totalQuantity, 0),
      mostBorrowedEquipment: data[0] || { equipment: null, borrowCount: 0, totalQuantity: 0 }
    },
    pagination: {
      totalItems,
      totalPages,
      currentPage,
      limit
    }
  };
};

exports.getReportDashboard = async () => {
  const [borrowReport, topEquipmentReport] = await Promise.all([
    exports.getBorrowReport({ page: 1, limit: 5 }),
    exports.getTopEquipmentReport({ page: 1, limit: 5 })
  ]);

  return {
    summary: borrowReport.summary,
    latestBorrowData: borrowReport.data,
    topEquipment: topEquipmentReport.data
  };
};
