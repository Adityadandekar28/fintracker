import express from "express";
import path from "path";
import bcrypt from "bcryptjs";
import { createServer as createViteServer } from "vite";
import { db } from "./server/db.js";
import { authMiddleware, generateToken, AuthenticatedRequest } from "./server/auth.js";
import { verifyEncryptionIntegrity } from "./server/crypto.js";
import { PERSONA_CONFIGS } from "./server/presetData.js";
import { UserSegment } from "./server/types.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Global Middlewares
  app.use(express.json());

  // --- API Routes ---

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "ExpenseTracker Fintech API",
      environment: process.env.NODE_ENV || "development",
    });
  });

  // Security Status & Encryption Verification
  app.get("/api/security/status", (_req, res) => {
    const securityAudit = verifyEncryptionIntegrity();
    res.json({
      ...securityAudit,
      storageType: "Encrypted-at-Rest with AES-256-GCM authenticated payload records",
      jwtAlgorithm: "HS256 (HMAC with SHA-256)",
      tlsEnforced: true,
      timestamp: new Date().toISOString(),
    });
  });

  // Persona Presets list
  app.get("/api/personas", (_req, res) => {
    res.json(PERSONA_CONFIGS);
  });

  // Auth: Register
  app.post("/api/auth/register", (req, res) => {
    try {
      const { email, password, name, segment, currency, monthlyIncome } = req.body;

      if (!email || !password || !name) {
        res.status(400).json({ error: "Email, password, and name are required." });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: "Password must be at least 6 characters long." });
        return;
      }

      const existing = db.findUserByEmail(email);
      if (existing) {
        res.status(409).json({ error: "An account with this email address already exists." });
        return;
      }

      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);

      const user = db.createUser({
        email,
        passwordHash,
        name: name.trim(),
        segment: (segment as UserSegment) || "professional",
        currency: currency || "$",
        monthlyIncome: Number(monthlyIncome) || 4000,
        alertThresholdPercent: 80,
        emailAlertsEnabled: true,
        inAppAlertsEnabled: true,
      });

      const token = generateToken(user);

      const { passwordHash: _, ...safeUser } = user;
      res.status(201).json({
        message: "Account registered successfully",
        token,
        user: safeUser,
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal registration error" });
    }
  });

  // Auth: Login
  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required." });
        return;
      }

      const user = db.findUserByEmail(email);
      if (!user) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }

      const isMatch = bcrypt.compareSync(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }

      const token = generateToken(user);
      const { passwordHash: _, ...safeUser } = user;

      res.json({
        message: "Login successful",
        token,
        user: safeUser,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal login error" });
    }
  });

  // Auth: 1-Click Demo Login
  app.post("/api/auth/demo-login", (req, res) => {
    try {
      const { segment } = req.body;
      const demoEmailMap: Record<string, string> = {
        professional: "alex.pro@fintech.dev",
        student: "sarah.student@campus.edu",
        homemaker: "elena.home@family.org",
      };

      const email = demoEmailMap[segment] || "alex.pro@fintech.dev";
      const user = db.findUserByEmail(email);

      if (!user) {
        res.status(404).json({ error: "Demo user not found" });
        return;
      }

      const token = generateToken(user);
      const { passwordHash: _, ...safeUser } = user;

      res.json({
        message: "Demo login successful",
        token,
        user: safeUser,
      });
    } catch (error: any) {
      res.status(500).json({ error: "Demo login failed" });
    }
  });

  // Auth: Get Current Profile
  app.get("/api/auth/me", authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const { passwordHash: _, ...safeUser } = user;
    res.json({ user: safeUser });
  });

  // Auth: Update Profile & Preferences
  app.put("/api/auth/profile", authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const { name, segment, currency, monthlyIncome, alertThresholdPercent, emailAlertsEnabled, inAppAlertsEnabled } = req.body;

      const updates: any = {};
      if (name !== undefined) updates.name = name.trim();
      if (segment !== undefined) updates.segment = segment;
      if (currency !== undefined) updates.currency = currency;
      if (monthlyIncome !== undefined) updates.monthlyIncome = Number(monthlyIncome);
      if (alertThresholdPercent !== undefined) updates.alertThresholdPercent = Math.min(100, Math.max(10, Number(alertThresholdPercent)));
      if (emailAlertsEnabled !== undefined) updates.emailAlertsEnabled = !!emailAlertsEnabled;
      if (inAppAlertsEnabled !== undefined) updates.inAppAlertsEnabled = !!inAppAlertsEnabled;

      const updated = db.updateUser(user.id, updates);
      if (!updated) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const { passwordHash: _, ...safeUser } = updated;
      res.json({ message: "Profile updated successfully", user: safeUser });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Categories: Get all
  app.get("/api/categories", authMiddleware, (req: AuthenticatedRequest, res) => {
    const categories = db.getCategoriesForUser(req.user!.id);
    res.json(categories);
  });

  // Categories: Create
  app.post("/api/categories", authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const { name, icon, color, type } = req.body;
      if (!name) {
        res.status(400).json({ error: "Category name is required" });
        return;
      }

      const newCat = db.createCategory(req.user!.id, {
        name: name.trim(),
        icon: icon || "Tag",
        color: color || "#6366F1",
        type: type === "income" ? "income" : "expense",
      });

      res.status(201).json(newCat);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  // Categories: Update
  app.put("/api/categories/:id", authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { name, icon, color, type } = req.body;

      const updated = db.updateCategory(id, req.user!.id, {
        ...(name ? { name: name.trim() } : {}),
        ...(icon ? { icon } : {}),
        ...(color ? { color } : {}),
        ...(type ? { type } : {}),
      });

      if (!updated) {
        res.status(404).json({ error: "Category not found" });
        return;
      }

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  // Categories: Delete
  app.delete("/api/categories/:id", authMiddleware, (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const deleted = db.deleteCategory(id, req.user!.id);
    if (!deleted) {
      res.status(404).json({ error: "Category not found or already deleted" });
      return;
    }
    res.json({ message: "Category deleted successfully" });
  });

  // Categories: Reset / Apply Persona Template
  app.post("/api/categories/reset-persona", authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const { segment, month } = req.body;
      const currentMonth = month || new Date().toISOString().substring(0, 7);
      const userSegment = (segment as UserSegment) || req.user!.segment || "professional";

      // Also update user segment in profile
      db.updateUser(req.user!.id, { segment: userSegment });

      const newCategories = db.resetUserPersonaCategories(req.user!.id, userSegment, currentMonth);
      res.json({
        message: `Template applied for ${PERSONA_CONFIGS[userSegment]?.title || userSegment}`,
        categories: newCategories,
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to apply persona template" });
    }
  });

  // Transactions: List with filtering
  app.get("/api/transactions", authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const { month, startDate, endDate, categoryId, type, paymentMethod, search, minAmount, maxAmount } = req.query;

      const transactions = db.getTransactionsForUser(req.user!.id, {
        month: month as string,
        startDate: startDate as string,
        endDate: endDate as string,
        categoryId: categoryId as string,
        type: type as any,
        paymentMethod: paymentMethod as string,
        search: search as string,
        minAmount: minAmount ? Number(minAmount) : undefined,
        maxAmount: maxAmount ? Number(maxAmount) : undefined,
      });

      res.json({
        transactions,
        totalCount: transactions.length,
        encryptedAtRest: true,
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to retrieve transactions" });
    }
  });

  // Transactions: Create (Encrypted at Rest)
  app.post("/api/transactions", authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const { date, categoryId, type, paymentMethod, amount, title, notes, tags, receiptUrl, isRecurring } = req.body;

      if (!title || amount === undefined || !categoryId) {
        res.status(400).json({ error: "Title, amount, and category are required." });
        return;
      }

      if (Number(amount) <= 0) {
        res.status(400).json({ error: "Amount must be a positive number." });
        return;
      }

      const txDate = date || new Date().toISOString().substring(0, 10);

      const created = db.createTransaction(req.user!.id, {
        date: txDate,
        categoryId,
        type: type === "income" ? "income" : "expense",
        paymentMethod: paymentMethod || "credit_card",
        amount: Number(amount),
        title: title.trim(),
        notes,
        tags: Array.isArray(tags) ? tags : [],
        receiptUrl,
        isRecurring: !!isRecurring,
      });

      // Check if this newly added expense triggers an alert
      const month = txDate.substring(0, 7);
      const budgetStatus = db.getOverallBudgetStatus(req.user!.id, month);
      const catStatus = budgetStatus.categoryStatuses.find((c: any) => c.categoryId === categoryId);

      let alertMessage: string | null = null;
      if (catStatus && catStatus.isOverBudget) {
        alertMessage = `Warning: You have exceeded your monthly budget for "${catStatus.categoryName}" by $${Math.abs(catStatus.remainingAmount).toFixed(2)}`;
      } else if (catStatus && catStatus.isNearThreshold) {
        alertMessage = `Notice: You have used ${catStatus.percentUsed}% of your "${catStatus.categoryName}" budget (Threshold: ${req.user!.alertThresholdPercent}%)`;
      }

      res.status(201).json({
        transaction: created,
        alert: alertMessage ? { triggered: true, message: alertMessage } : null,
      });
    } catch (error: any) {
      console.error("Create transaction error:", error);
      res.status(500).json({ error: "Failed to create encrypted transaction" });
    }
  });

  // Transactions: Update
  app.put("/api/transactions/:id", authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { date, categoryId, type, paymentMethod, amount, title, notes, tags, receiptUrl, isRecurring } = req.body;

      const updated = db.updateTransaction(id, req.user!.id, {
        date,
        categoryId,
        type,
        paymentMethod,
        amount: amount !== undefined ? Number(amount) : undefined,
        title,
        notes,
        tags,
        receiptUrl,
        isRecurring,
      });

      if (!updated) {
        res.status(404).json({ error: "Transaction not found" });
        return;
      }

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update transaction" });
    }
  });

  // Transactions: Delete
  app.delete("/api/transactions/:id", authMiddleware, (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const deleted = db.deleteTransaction(id, req.user!.id);
    if (!deleted) {
      res.status(404).json({ error: "Transaction not found or already deleted" });
      return;
    }
    res.json({ message: "Transaction deleted successfully" });
  });

  // Budgets: Get Status & Breakdown
  app.get("/api/budgets/status", authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const month = (req.query.month as string) || new Date().toISOString().substring(0, 7);
      const status = db.getOverallBudgetStatus(req.user!.id, month);
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to compute budget status" });
    }
  });

  // Budgets: Upsert category budget
  app.post("/api/budgets", authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const { categoryId, month, limitAmount } = req.body;
      if (!categoryId || limitAmount === undefined) {
        res.status(400).json({ error: "Category ID and limit amount are required." });
        return;
      }

      const curMonth = month || new Date().toISOString().substring(0, 7);
      const budget = db.upsertCategoryBudget(req.user!.id, categoryId, curMonth, Math.max(0, Number(limitAmount)));

      res.json(budget);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update budget" });
    }
  });

  // Monthly Spending Reports & Analytics
  app.get("/api/reports/monthly", authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const month = (req.query.month as string) || new Date().toISOString().substring(0, 7);
      const report = db.getMonthlyReport(req.user!.id, month);
      res.json(report);
    } catch (error: any) {
      console.error("Report generation error:", error);
      res.status(500).json({ error: "Failed to generate monthly report" });
    }
  });

  // Export Transactions (CSV or JSON format)
  app.get("/api/export", authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const format = (req.query.format as string) || "csv";
      const month = req.query.month as string;
      const transactions = db.getTransactionsForUser(req.user!.id, { month });

      if (format === "json") {
        res.setHeader("Content-Disposition", `attachment; filename=expenses_${month || "all"}.json`);
        res.setHeader("Content-Type", "application/json");
        res.json({
          exportedAt: new Date().toISOString(),
          user: { name: req.user!.name, email: req.user!.email, currency: req.user!.currency },
          recordCount: transactions.length,
          transactions,
        });
        return;
      }

      // Generate CSV
      const headers = ["ID", "Date", "Title", "Type", "Category", "Payment Method", "Amount", "Currency", "Tags", "Notes"];
      const rows = transactions.map((t) => [
        `"${t.id}"`,
        `"${t.date}"`,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${t.type}"`,
        `"${(t.categoryName || "").replace(/"/g, '""')}"`,
        `"${t.paymentMethod}"`,
        t.amount.toFixed(2),
        `"${req.user!.currency}"`,
        `"${(t.tags || []).join(";")}"`,
        `"${(t.notes || "").replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      res.setHeader("Content-Disposition", `attachment; filename=expenses_${month || "all"}.csv`);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.send(csvContent);
    } catch (error: any) {
      res.status(500).json({ error: "Export generation failed" });
    }
  });

  // --- Vite Dev & Production Static Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Expense Tracker full-stack fintech server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
