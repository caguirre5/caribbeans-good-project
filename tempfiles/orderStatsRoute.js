// Main/routes/orderStatsRoutes.js
const express = require('express');
const { admin, db } = require('../config/firebaseAdminConfig'); // mismo import que en tus otras rutas
const router = express.Router();

/**
 * Middlewares (mismos que usas en contractsStatsRoutes / orderRoutes)
 */

const verifyAdmin = async (req, res, next) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];

  if (!idToken) {
    return res.status(403).send('Unauthorized');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return res.status(403).send('Unauthorized');
    }

    const userData = userDoc.data();
    if (Array.isArray(userData.roles) && userData.roles.includes('admin')) {
      req.user = decodedToken;
      return next();
    } else {
      return res.status(403).send('Insufficient permissions');
    }
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(403).send('Unauthorized');
  }
};

const verifyUser = async (req, res, next) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];

  if (!idToken) {
    return res.status(403).send('Unauthorized');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    return next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(403).send('Unauthorized');
  }
};

/**
 * Helpers internos
 */

// convierte un objeto { clave: valor } a arreglo [{ key, value }, ...]
// (en nuestro caso lo uso por variedad / mes / método de envío)
function mapToArray(map) {
  return Object.entries(map).map(([key, value]) => ({ key, ...value }));
}

// normaliza un timestamp de Firestore a Date o null
function toDate(ts) {
  if (!ts) return null;
  if (ts.toDate && typeof ts.toDate === 'function') return ts.toDate();
  if (ts instanceof Date) return ts;
  return null;
}

// formatea YYYY-MM para agrupar por mes
function toYearMonth(date) {
  if (!date) return 'unknown';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Lógica central: stats de órdenes por usuario
 */

async function getOrderStatsForUser(userId) {
  const snap = await db
    .collection('orders')        // ajusta si tu colección se llama distinto
    .where('createdBy', '==', userId)
    .get();

  // Si no hay órdenes, devolvemos estructura completa pero en cero
  if (snap.empty) {
    return {
      userId,
      basic: {
        totalOrders: 0,
        activeOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
      },
      volume: {
        totalKg: 0,
        totalBags: 0,
        avgKgPerOrder: 0,
        avgBagsPerOrder: 0,
        kgByVariety: [],
      },
      financial: {
        totalAmountGBP: 0,
        totalSubtotalGBP: 0,
        totalDeliveryFeesGBP: 0,
        avgOrderValueGBP: 0,
        avgDeliveryFeeGBP: 0,
        spendByVariety: [],
        spendByMonth: [],
      },
      time: {
        firstOrderAt: null,
        lastOrderAt: null,
        orderCountByMonth: [],
        daysBetweenFirstAndLast: null,
        avgDaysBetweenOrders: null,
      },
      shipping: {
        countByMethod: [],
        kgByMethod: [],
        amountByMethod: [],
      },
    };
  }

  // --- acumuladores globales ---

  let totalOrders = 0;
  let activeOrders = 0;
  let completedOrders = 0;
  let cancelledOrders = 0;

  let totalKg = 0;
  let totalBags = 0;
  let totalAmountGBP = 0;
  let totalSubtotalGBP = 0;
  let totalDeliveryFeesGBP = 0;

  let firstOrderAt = null;
  let lastOrderAt = null;

  // por variedad
  const kgByVarietyMap = {};     // { varietyName: number }
  const bagsByVarietyMap = {};   // { varietyName: number }
  const spendByVarietyMap = {};  // { varietyName: number }

  // por mes (YYYY-MM)
  const orderCountByMonthMap = {};   // { '2025-01': number }
  const spendByMonthMap = {};        // { '2025-01': number }

  // por método de envío
  const countByMethodMap = {};       // { 'pickup': { count, totalKg, totalAmount } }
  // aquí ya guardamos kg y amount dentro del mismo objeto para no tener 20 mapas distintos

  const orderDates = []; // para métricas de intervalo de tiempo

  // --- procesar cada orden ---

  snap.forEach((doc) => {
    const data = doc.data() || {};
    totalOrders++;

    const status = (data.status || '').toLowerCase() || 'unknown';
    if (status === 'active' || status === 'pending' || status === 'dispatched') {
      activeOrders++;
    } else if (status === 'completed') {
      completedOrders++;
    } else if (status === 'cancelled') {
      cancelledOrders++;
    }

    // timestamps
    const createdAt = toDate(data.createdAt);
    const preferredDeliveryDate = toDate(data.preferredDeliveryDate);

    if (createdAt) {
      orderDates.push(createdAt.getTime());
      if (!firstOrderAt || createdAt < firstOrderAt) firstOrderAt = createdAt;
      if (!lastOrderAt || createdAt > lastOrderAt) lastOrderAt = createdAt;

      const ym = toYearMonth(createdAt);
      orderCountByMonthMap[ym] = (orderCountByMonthMap[ym] || 0) + 1;
    }

    // totales de la orden
    const totals = data.totals || {};
    const orderTotal = typeof totals.total === 'number' ? totals.total : 0;
    const orderSubtotal = typeof totals.subtotal === 'number' ? totals.subtotal : 0;
    const deliveryFee = typeof totals.deliveryFee === 'number' ? totals.deliveryFee : 0;
    const totalBagsFromTotals = typeof totals.totalBags === 'number' ? totals.totalBags : 0;

    totalAmountGBP += orderTotal;
    totalSubtotalGBP += orderSubtotal;
    totalDeliveryFeesGBP += deliveryFee;
    totalBags += totalBagsFromTotals;

    // volumen en kg de la orden (desde items)
    const items = Array.isArray(data.items) ? data.items : [];
    let orderKg = 0;

    items.forEach((item) => {
      const varietyName = item.varietyName || 'Unknown variety';
      const bags = typeof item.bags === 'number' ? item.bags : 0;
      const bagKg = typeof item.bagKg === 'number' ? item.bagKg : 24;
      const lineKg =
        typeof item.lineKg === 'number' ? item.lineKg : bags * bagKg;
      const lineSubtotal =
        typeof item.lineSubtotal === 'number' ? item.lineSubtotal : 0;

      orderKg += lineKg;

      // por variedad
      kgByVarietyMap[varietyName] =
        (kgByVarietyMap[varietyName] || 0) + lineKg;
      bagsByVarietyMap[varietyName] =
        (bagsByVarietyMap[varietyName] || 0) + bags;
      spendByVarietyMap[varietyName] =
        (spendByVarietyMap[varietyName] || 0) + lineSubtotal;
    });

    totalKg += orderKg;

    // por mes (para revenue)
    if (createdAt) {
      const ym = toYearMonth(createdAt);
      spendByMonthMap[ym] = (spendByMonthMap[ym] || 0) + orderTotal;
    }

    // por método de envío
    const method = data.deliveryMethod || 'unknown';
    if (!countByMethodMap[method]) {
      countByMethodMap[method] = {
        method,
        count: 0,
        totalKg: 0,
        totalAmountGBP: 0,
      };
    }
    countByMethodMap[method].count += 1;
    countByMethodMap[method].totalKg += orderKg;
    countByMethodMap[method].totalAmountGBP += orderTotal;
  });

  // --- métricas derivadas ---

  const avgOrderValueGBP =
    totalOrders > 0 ? totalAmountGBP / totalOrders : 0;

  const avgDeliveryFeeGBP =
    totalOrders > 0 ? totalDeliveryFeesGBP / totalOrders : 0;

  const avgKgPerOrder = totalOrders > 0 ? totalKg / totalOrders : 0;
  const avgBagsPerOrder = totalOrders > 0 ? totalBags / totalOrders : 0;

  let daysBetweenFirstAndLast = null;
  let avgDaysBetweenOrders = null;

  if (orderDates.length >= 2) {
    const minT = Math.min(...orderDates);
    const maxT = Math.max(...orderDates);
    daysBetweenFirstAndLast = (maxT - minT) / (1000 * 60 * 60 * 24);

    // promedio de días entre pedidos consecutivos
    orderDates.sort((a, b) => a - b);
    let sumDiff = 0;
    for (let i = 1; i < orderDates.length; i++) {
      sumDiff += (orderDates[i] - orderDates[i - 1]) / (1000 * 60 * 60 * 24);
    }
    avgDaysBetweenOrders = sumDiff / (orderDates.length - 1);
  }

  // --- transformar maps a arreglos consumibles por el front ---

  const kgByVariety = Object.keys(kgByVarietyMap).map((varietyName) => ({
    varietyName,
    totalKg: kgByVarietyMap[varietyName],
    totalBags: bagsByVarietyMap[varietyName] || 0,
    totalAmountGBP: spendByVarietyMap[varietyName] || 0,
  }));

  const orderCountByMonth = Object.entries(orderCountByMonthMap)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => (a.month < b.month ? -1 : 1));

  const spendByMonth = Object.entries(spendByMonthMap)
    .map(([month, total]) => ({ month, totalAmountGBP: total }))
    .sort((a, b) => (a.month < b.month ? -1 : 1));

  const shippingStats = Object.values(countByMethodMap);

  // --- objeto final de respuesta ---

  return {
    userId,
    basic: {
      totalOrders,
      activeOrders,
      completedOrders,
      cancelledOrders,
    },
    volume: {
      totalKg,
      totalBags,
      avgKgPerOrder,
      avgBagsPerOrder,
      kgByVariety,
    },
    financial: {
      totalAmountGBP,
      totalSubtotalGBP,
      totalDeliveryFeesGBP,
      avgOrderValueGBP,
      avgDeliveryFeeGBP,
      spendByVariety: kgByVariety.map((v) => ({
        varietyName: v.varietyName,
        totalAmountGBP: v.totalAmountGBP,
      })),
      spendByMonth,
    },
    time: {
      firstOrderAt,
      lastOrderAt,
      orderCountByMonth,
      daysBetweenFirstAndLast,
      avgDaysBetweenOrders,
    },
    shipping: {
      countByMethod: shippingStats.map((s) => ({
        method: s.method,
        count: s.count,
      })),
      kgByMethod: shippingStats.map((s) => ({
        method: s.method,
        totalKg: s.totalKg,
      })),
      amountByMethod: shippingStats.map((s) => ({
        method: s.method,
        totalAmountGBP: s.totalAmountGBP,
      })),
    },
  };
}

/**
 * Rutas
 */

// 1) Ruta para que el propio usuario vea sus stats: GET /orders/stats/me
router.get('/orders/stats/me', verifyUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const stats = await getOrderStatsForUser(userId);
    return res.json(stats);
  } catch (error) {
    console.error('Error getting order stats for user:', error);
    return res.status(500).send('Internal server error');
  }
});

// 2) Ruta admin para ver stats de cualquier cliente: GET /admin/orders/stats/:userId
router.get('/admin/orders/stats/:userId', verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = await getOrderStatsForUser(userId);
    return res.json(stats);
  } catch (error) {
    console.error('Error getting order stats for admin:', error);
    return res.status(500).send('Internal server error');
  }
});

module.exports = router;
