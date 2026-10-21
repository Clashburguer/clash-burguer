import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getManausDateTime,
  getLiveShiftStatus,
  executeDailyClosing,
  reopenDailyClosing,
  getAllClosings,
  generateClosingCSV,
  getAllOrders,
  createOrder,
  updateOrderStatus,
  getSettings,
  saveSettings,
} from './src/server/cashRegisterService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // -----------------------------------------------------------
  // CASH REGISTER & ORDER API ROUTES
  // -----------------------------------------------------------

  // Live status for today's shift
  app.get('/api/cash-register/live', (req, res) => {
    try {
      const liveStatus = getLiveShiftStatus();
      res.json(liveStatus);
    } catch (err: any) {
      console.error('Error fetching live shift status:', err);
      res.status(500).json({ error: err.message || 'Internal error' });
    }
  });

  // Execute closing (manual or scheduled)
  app.post('/api/cash-register/close', (req, res) => {
    try {
      const { date, closedBy, force, initialFloat } = req.body;
      const result = executeDailyClosing(
        date,
        closedBy || 'Administrador',
        false,
        Boolean(force),
        initialFloat !== undefined ? Number(initialFloat) : undefined
      );
      res.json(result);
    } catch (err: any) {
      console.error('Error executing closing:', err);
      res.status(500).json({ error: err.message || 'Internal error' });
    }
  });

  // Reopen closing (with audit log)
  app.post('/api/cash-register/reopen', (req, res) => {
    try {
      const { date, user, reason, adminPin } = req.body;
      const settings = getSettings();

      if (adminPin !== settings.adminPin) {
        return res.status(401).json({ error: 'PIN de segurança de administrador inválido.' });
      }

      if (!reason || !reason.trim()) {
        return res.status(400).json({ error: 'É obrigatório informar a justificativa para reabertura do caixa.' });
      }

      const result = reopenDailyClosing(date, user || 'Administrador', reason);
      res.json(result);
    } catch (err: any) {
      console.error('Error reopening closing:', err);
      res.status(500).json({ error: err.message || 'Internal error' });
    }
  });

  // History of all closings
  app.get('/api/cash-register/history', (req, res) => {
    try {
      const closings = getAllClosings();
      res.json(closings);
    } catch (err: any) {
      console.error('Error fetching closing history:', err);
      res.status(500).json({ error: err.message || 'Internal error' });
    }
  });

  // Export CSV for Excel
  app.get('/api/cash-register/export/:date', (req, res) => {
    try {
      const { date } = req.params;
      const closings = getAllClosings();
      const closing = closings.find((c) => c.date === date);

      if (!closing) {
        return res.status(404).send('Fechamento não encontrado para a data.');
      }

      const allOrders = getAllOrders();
      const ordersForDate = allOrders.filter((o) => o.localDate === date);
      const csvData = generateClosingCSV(closing, ordersForDate);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="fechamento-caixa-clash-${date}.csv"`
      );
      res.send('\uFEFF' + csvData); // UTF-8 BOM for Excel compatibility
    } catch (err: any) {
      console.error('Error exporting CSV:', err);
      res.status(500).send('Erro ao exportar CSV');
    }
  });

  // Get orders (optionally filter by date)
  app.get('/api/orders', (req, res) => {
    try {
      const { date } = req.query;
      const orders = getAllOrders();
      if (date && typeof date === 'string') {
        return res.json(orders.filter((o) => o.localDate === date));
      }
      res.json(orders);
    } catch (err: any) {
      console.error('Error getting orders:', err);
      res.status(500).json({ error: err.message || 'Internal error' });
    }
  });

  // Create new order (called on customer checkout)
  app.post('/api/orders', (req, res) => {
    try {
      const order = createOrder(req.body);
      res.status(201).json(order);
    } catch (err: any) {
      console.error('Error creating order:', err);
      res.status(500).json({ error: err.message || 'Internal error' });
    }
  });

  // Update order status or payment
  app.patch('/api/orders/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { status, paymentStatus } = req.body;
      const updated = updateOrderStatus(id, status, paymentStatus);
      if (!updated) {
        return res.status(404).json({ error: 'Pedido não encontrado.' });
      }
      res.json(updated);
    } catch (err: any) {
      console.error('Error updating order:', err);
      res.status(500).json({ error: err.message || 'Internal error' });
    }
  });

  // Settings
  app.get('/api/settings', (req, res) => {
    res.json(getSettings());
  });

  app.post('/api/settings', (req, res) => {
    try {
      const updated = saveSettings(req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal error' });
    }
  });

  // -----------------------------------------------------------
  // AUTOMATED CLOSING ROUTINE (23:00 America/Manaus)
  // -----------------------------------------------------------
  let lastCheckedMinute = -1;

  setInterval(() => {
    try {
      const manaus = getManausDateTime();

      // Check once per minute
      if (manaus.minute !== lastCheckedMinute) {
        lastCheckedMinute = manaus.minute;

        // At 23:00 or later, ensure today's shift is closed
        if (manaus.hour >= 23) {
          const closings = getAllClosings();
          const alreadyClosed = closings.some(
            (c) => c.date === manaus.dateStr && c.status === 'closed'
          );

          if (!alreadyClosed) {
            console.log(
              `[Auto-Close] Executing automatic 23:00 cash register closing for date ${manaus.dateStr} (America/Manaus)...`
            );
            const result = executeDailyClosing(
              manaus.dateStr,
              'Sistema Automático (23:00)',
              true
            );
            if (result.success) {
              console.log(
                `[Auto-Close] Shift ${manaus.dateStr} successfully closed automatically: Total R$ ${result.closing.totalReceived}`
              );
            }
          }
        }
      }
    } catch (err) {
      console.error('[Auto-Close] Error during automatic closing check:', err);
    }
  }, 20000); // Check every 20 seconds

  // -----------------------------------------------------------
  // VITE DEV SERVER OR STATIC PRODUCTION
  // -----------------------------------------------------------
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Clash Burguer Server running on http://0.0.0.0:${port}`);
    console.log(`Timezone: America/Manaus. Auto-closing set for 23:00 local time.`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
