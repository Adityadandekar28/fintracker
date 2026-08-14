import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { User, Category, EncryptedTransactionRecord, DecryptedTransaction, CategoryBudget, UserSegment } from "./types.js";
import { encryptPayload, decryptPayload } from "./crypto.js";
import { PERSONA_CONFIGS } from "./presetData.js";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "expense_database.json");

interface DatabaseSchema {
  users: User[];
  categories: Category[];
  transactions: EncryptedTransactionRecord[];
  budgets: CategoryBudget[];
  version: number;
}

class DatabaseService {
  private data: DatabaseSchema = {
    users: [],
    categories: [],
    transactions: [],
    budgets: [],
    version: 1,
  };
  private isLoaded = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(raw);
        this.isLoaded = true;

        let needsSave = false;

        // Upgrade any legacy $ currency users to ₹ Rupee
        for (const user of this.data.users) {
          if (!user.currency || user.currency === "$") {
            user.currency = "₹";
            needsSave = true;
          }
        }

        // Auto-migrate records to active master key if decrypted with keyring
        let migratedCount = 0;
        for (const tx of this.data.transactions) {
          const dec = decryptPayload<{
            amount: number;
            title: string;
            notes?: string;
            tags?: string[];
            receiptUrl?: string;
          }>(tx.encryptedPayload);
          if (dec && typeof dec.amount === "number") {
            tx.encryptedPayload = encryptPayload(dec);
            migratedCount++;
          }
        }
        if (migratedCount > 0 || needsSave) {
          this.save();
        }
        console.log(`Database loaded: ${this.data.users.length} users, ${this.data.transactions.length} encrypted transactions (${migratedCount} synced to active key).`);
      } else {
        this.seedDemoData();
        this.save();
        this.isLoaded = true;
      }
    } catch (err) {
      console.warn("Could not load database file, initializing in-memory store:", err);
      this.seedDemoData();
      this.isLoaded = true;
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      console.warn("Failed to persist database to disk (operating in-memory):", err);
    }
  }

  private seedDemoData() {
    console.log("Seeding fresh demo database with multi-persona test accounts...");
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync("password123", salt);

    const demoUsers: Array<{
      id: string;
      email: string;
      name: string;
      segment: UserSegment;
      currency: string;
      monthlyIncome: number;
    }> = [
      {
        id: "usr_prof_101",
        email: "alex.pro@fintech.dev",
        name: "Alex Vance",
        segment: "professional",
        currency: "₹",
        monthlyIncome: 120000,
      },
      {
        id: "usr_stud_102",
        email: "sarah.student@campus.edu",
        name: "Sarah Chen",
        segment: "student",
        currency: "₹",
        monthlyIncome: 25000,
      },
      {
        id: "usr_home_103",
        email: "elena.home@family.org",
        name: "Elena Martinez",
        segment: "homemaker",
        currency: "₹",
        monthlyIncome: 75000,
      }
    ];

    const currentYear = new Date().getFullYear();
    const currentMonthNum = new Date().getMonth() + 1;
    const currentMonthStr = `${currentYear}-${String(currentMonthNum).padStart(2, "0")}`;
    const prevMonthNum = currentMonthNum === 1 ? 12 : currentMonthNum - 1;
    const prevYear = currentMonthNum === 1 ? currentYear - 1 : currentYear;
    const prevMonthStr = `${prevYear}-${String(prevMonthNum).padStart(2, "0")}`;

    for (const u of demoUsers) {
      const user: User = {
        id: u.id,
        email: u.email,
        passwordHash,
        name: u.name,
        segment: u.segment,
        currency: u.currency,
        monthlyIncome: u.monthlyIncome,
        alertThresholdPercent: 80,
        emailAlertsEnabled: true,
        inAppAlertsEnabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.data.users.push(user);

      // Create categories based on persona
      const personaConfig = PERSONA_CONFIGS[u.segment];
      const userCatMap = new Map<string, string>(); // name -> catId

      personaConfig.categories.forEach((catTpl, idx) => {
        const catId = `cat_${u.id}_${idx + 1}`;
        userCatMap.set(catTpl.name, catId);
        this.data.categories.push({
          id: catId,
          userId: u.id,
          name: catTpl.name,
          icon: catTpl.icon,
          color: catTpl.color,
          type: catTpl.type,
          isDefault: true,
        });

        // Set monthly budgets for expense categories
        if (catTpl.type === "expense" && catTpl.defaultBudget > 0) {
          this.data.budgets.push({
            id: `bgt_${catId}_${currentMonthStr}`,
            userId: u.id,
            categoryId: catId,
            month: currentMonthStr,
            limitAmount: catTpl.defaultBudget,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      });

      // Add realistic sample transactions for the current and previous month
      if (u.segment === "professional") {
        this.seedProfessionalTransactions(u.id, userCatMap, currentMonthStr, prevMonthStr);
      } else if (u.segment === "student") {
        this.seedStudentTransactions(u.id, userCatMap, currentMonthStr, prevMonthStr);
      } else if (u.segment === "homemaker") {
        this.seedHomemakerTransactions(u.id, userCatMap, currentMonthStr, prevMonthStr);
      }
    }
  }

  private seedProfessionalTransactions(
    userId: string,
    catMap: Map<string, string>,
    curMonth: string,
    prevMonth: string
  ) {
    const rentId = catMap.get("Housing Rent / Home Loan EMI") || "";
    const groceryId = catMap.get("Groceries & Quick Commerce (Blinkit/Zepto)") || "";
    const diningId = catMap.get("Dining Out, Cafes & Swiggy/Zomato") || "";
    const utilId = catMap.get("Utilities, Electricity & High-Speed Wi-Fi") || "";
    const commuteId = catMap.get("Fuel, Car EMI & Metro/Cabs") || "";
    const investId = catMap.get("Mutual Funds SIP & Stock Portfolio") || "";
    const healthId = catMap.get("Gym, Cult.fit & Health Wellness") || "";
    const salaryId = catMap.get("Primary Corporate Salary") || "";

    const txs: Array<{
      date: string;
      categoryId: string;
      type: "expense" | "income";
      method: "credit_card" | "debit_card" | "cash" | "bank_transfer" | "upi";
      amount: number;
      title: string;
      notes: string;
      tags: string[];
    }> = [
      // Incomes
      { date: `${curMonth}-01`, categoryId: salaryId, type: "income", method: "bank_transfer", amount: 120000, title: "Monthly Corporate Salary Transfer", notes: "Direct NEFT deposit with tax deductions", tags: ["salary", "work"] },
      { date: `${prevMonth}-01`, categoryId: salaryId, type: "income", method: "bank_transfer", amount: 120000, title: "Monthly Corporate Salary Transfer", notes: "Direct NEFT deposit with tax deductions", tags: ["salary", "work"] },
      
      // Fixed Expenses
      { date: `${curMonth}-02`, categoryId: rentId, type: "expense", method: "bank_transfer", amount: 32000, title: "Apartment Rent & Maintenance", notes: "NetBanking wire transfer", tags: ["rent", "housing"] },
      { date: `${curMonth}-03`, categoryId: investId, type: "expense", method: "bank_transfer", amount: 15000, title: "Nifty 50 Index Mutual Fund SIP", notes: "Auto-debit monthly SIP portfolio", tags: ["investing", "sip"] },
      { date: `${curMonth}-04`, categoryId: utilId, type: "expense", method: "upi", amount: 2499, title: "Jio Fiber & Adani Electricity Bill", notes: "Auto-pay via UPI", tags: ["utilities", "bills"] },
      { date: `${curMonth}-05`, categoryId: healthId, type: "expense", method: "upi", amount: 2500, title: "Cult.fit Pass Monthly Membership", notes: "Fitness & strength tier renewal", tags: ["health", "gym"] },

      // Variable Expenses (Current Month)
      { date: `${curMonth}-06`, categoryId: groceryId, type: "expense", method: "upi", amount: 3450, title: "Blinkit & Nature's Basket Groceries", notes: "Weekly organic vegetables & dairy", tags: ["food", "groceries"] },
      { date: `${curMonth}-08`, categoryId: diningId, type: "expense", method: "credit_card", amount: 2400, title: "Dinner & Drinks at Olive Bistro", notes: "Dinner with colleagues", tags: ["dining", "work"] },
      { date: `${curMonth}-10`, categoryId: commuteId, type: "expense", method: "upi", amount: 2800, title: "Indian Oil Petrol Refuel", notes: "Full tank XP95 petrol", tags: ["commute", "fuel"] },
      { date: `${curMonth}-12`, categoryId: groceryId, type: "expense", method: "upi", amount: 4120, title: "Zepto Quick Supplies & Staples", notes: "Pantry replenishment & snacks", tags: ["groceries"] },
      { date: `${curMonth}-13`, categoryId: diningId, type: "expense", method: "upi", amount: 650, title: "Third Wave Coffee & Croissants", notes: "Morning remote work session", tags: ["coffee"] },
      { date: `${curMonth}-14`, categoryId: diningId, type: "expense", method: "credit_card", amount: 4800, title: "Anniversary Celebration Dinner", notes: "Special family fine dining", tags: ["dining", "celebration"] },
      { date: `${curMonth}-14`, categoryId: investId, type: "expense", method: "bank_transfer", amount: 5000, title: "Gold ETF & Sovereign Bonds", notes: "Quarterly portfolio rebalance", tags: ["gold", "investing"] },

      // Prev Month Historical
      { date: `${prevMonth}-02`, categoryId: rentId, type: "expense", method: "bank_transfer", amount: 32000, title: "Apartment Rent & Maintenance", notes: "NetBanking wire", tags: ["rent"] },
      { date: `${prevMonth}-05`, categoryId: groceryId, type: "expense", method: "upi", amount: 12800, title: "Monthly Supermarket Spend", notes: "Consolidated supermarket receipts", tags: ["groceries"] },
      { date: `${prevMonth}-15`, categoryId: diningId, type: "expense", method: "upi", amount: 8900, title: "Swiggy & Weekend Dining Outings", notes: "Weekend restaurants and deliveries", tags: ["dining"] },
      { date: `${prevMonth}-18`, categoryId: investId, type: "expense", method: "bank_transfer", amount: 20000, title: "Flexi-Cap Mutual Funds", notes: "Automated wealth accumulation", tags: ["investing"] },
    ];

    txs.forEach((t, i) => {
      this.createTransactionInternal(userId, {
        date: t.date,
        categoryId: t.categoryId,
        type: t.type,
        paymentMethod: t.method,
        amount: t.amount,
        title: t.title,
        notes: t.notes,
        tags: t.tags,
        isRecurring: false,
      }, `demo_tx_${userId}_${i}`);
    });
  }

  private seedStudentTransactions(
    userId: string,
    catMap: Map<string, string>,
    curMonth: string,
    prevMonth: string
  ) {
    const tuitionId = catMap.get("Tuition & Semester Fees") || "";
    const booksId = catMap.get("Books & Course Materials") || "";
    const foodId = catMap.get("Campus Canteen & Dining") || "";
    const dormId = catMap.get("Hostel / PG & Accommodation") || "";
    const transitId = catMap.get("Metro & Local Commute") || "";
    const funId = catMap.get("Weekend Outings & Friends") || "";
    const techId = catMap.get("Mobile Data & OTT Subscriptions") || "";
    const stipendId = catMap.get("Internship Stipend / Part-Time") || "";

    const txs: Array<{
      date: string;
      categoryId: string;
      type: "expense" | "income";
      method: "credit_card" | "debit_card" | "cash" | "bank_transfer" | "upi";
      amount: number;
      title: string;
      notes: string;
      tags: string[];
    }> = [
      { date: `${curMonth}-01`, categoryId: stipendId, type: "income", method: "bank_transfer", amount: 25000, title: "Research & Lab Internship Stipend", notes: "Monthly direct grant transfer", tags: ["stipend", "campus"] },
      { date: `${curMonth}-02`, categoryId: dormId, type: "expense", method: "upi", amount: 7500, title: "Campus Hostel & PG Rent", notes: "Monthly hostel rent installment", tags: ["dorm"] },
      { date: `${curMonth}-03`, categoryId: booksId, type: "expense", method: "upi", amount: 1850, title: "Engineering & Algorithms Reference Textbooks", notes: "Bookstore course materials", tags: ["books", "study"] },
      { date: `${curMonth}-05`, categoryId: transitId, type: "expense", method: "upi", amount: 1200, title: "Delhi Metro Monthly SmartCard Pass", notes: "Daily student commute", tags: ["transit"] },
      { date: `${curMonth}-07`, categoryId: foodId, type: "expense", method: "upi", amount: 2800, title: "Hostel Mess & Canteen Meal Recharge", notes: "Monthly dining cafeteria pass", tags: ["dining", "food"] },
      { date: `${curMonth}-09`, categoryId: techId, type: "expense", method: "upi", amount: 599, title: "Jio 5G Unlimited + Spotify Student", notes: "Connectivity and study music", tags: ["tech", "student-deal"] },
      { date: `${curMonth}-11`, categoryId: funId, type: "expense", method: "upi", amount: 1450, title: "Weekend Movie & Pizza Outing", notes: "Hostel friends social gathering", tags: ["fun", "friends"] },
      { date: `${curMonth}-13`, categoryId: foodId, type: "expense", method: "upi", amount: 1100, title: "Quick Groceries & Protein Snacks", notes: "Fruits, dry fruits, oats and milk", tags: ["groceries"] },
    ];

    txs.forEach((t, i) => {
      this.createTransactionInternal(userId, {
        date: t.date,
        categoryId: t.categoryId,
        type: t.type,
        paymentMethod: t.method,
        amount: t.amount,
        title: t.title,
        notes: t.notes,
        tags: t.tags,
        isRecurring: false,
      }, `demo_tx_${userId}_${i}`);
    });
  }

  private seedHomemakerTransactions(
    userId: string,
    catMap: Map<string, string>,
    curMonth: string,
    prevMonth: string
  ) {
    const marketId = catMap.get("Supermarket & Bulk Monthly Groceries") || "";
    const homeId = catMap.get("Home Maintenance, Society & Repairs") || "";
    const kidsId = catMap.get("Children School Fees & Tuition") || "";
    const medId = catMap.get("Family Healthcare & Medical Pharmacy") || "";
    const utilId = catMap.get("Electricity, LPG Gas & Water") || "";
    const outingId = catMap.get("Family Dining & Weekend Outings") || "";
    const incomeId = catMap.get("Monthly Household Fund Transfer") || "";

    const txs: Array<{
      date: string;
      categoryId: string;
      type: "expense" | "income";
      method: "credit_card" | "debit_card" | "cash" | "bank_transfer" | "upi";
      amount: number;
      title: string;
      notes: string;
      tags: string[];
    }> = [
      { date: `${curMonth}-01`, categoryId: incomeId, type: "income", method: "bank_transfer", amount: 75000, title: "Monthly Household Maintenance Deposit", notes: "Family joint expense budget allocation", tags: ["family", "budget"] },
      { date: `${curMonth}-02`, categoryId: marketId, type: "expense", method: "upi", amount: 8500, title: "DMart Monthly Bulk Provisions", notes: "Monthly grains, oils, staples & detergents", tags: ["groceries", "dmart"] },
      { date: `${curMonth}-04`, categoryId: utilId, type: "expense", method: "upi", amount: 4800, title: "Tata Power & Indane Gas Cylinder", notes: "Monthly utility bills via Bharat BillPay", tags: ["utilities"] },
      { date: `${curMonth}-06`, categoryId: kidsId, type: "expense", method: "bank_transfer", amount: 12000, title: "School Quarterly Fees & Karate Classes", notes: "Kids education and extracurriculars", tags: ["kids", "activities"] },
      { date: `${curMonth}-08`, categoryId: medId, type: "expense", method: "upi", amount: 2400, title: "Apollo Pharmacy Prescriptions & Vitamins", notes: "Monthly senior citizen medicines & health checks", tags: ["medical", "health"] },
      { date: `${curMonth}-10`, categoryId: marketId, type: "expense", method: "upi", amount: 3200, title: "Local Fresh Sabzi Mandi & Milk Dairy", notes: "Weekly fresh vegetables, fruits and paneer", tags: ["groceries"] },
      { date: `${curMonth}-12`, categoryId: homeId, type: "expense", method: "upi", amount: 2800, title: "Society Maintenance & Water Purifier Service", notes: "Quarterly RO filter change & society dues", tags: ["home", "diy"] },
      { date: `${curMonth}-14`, categoryId: outingId, type: "expense", method: "upi", amount: 4200, title: "Family Weekend Dinner at Barbeque Nation", notes: "Weekend family get-together", tags: ["family", "outing"] },
    ];

    txs.forEach((t, i) => {
      this.createTransactionInternal(userId, {
        date: t.date,
        categoryId: t.categoryId,
        type: t.type,
        paymentMethod: t.method,
        amount: t.amount,
        title: t.title,
        notes: t.notes,
        tags: t.tags,
        isRecurring: false,
      }, `demo_tx_${userId}_${i}`);
    });
  }

  // --- User Operations ---

  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public createUser(user: Omit<User, "id" | "createdAt" | "updatedAt">): User {
    const newUser: User = {
      ...user,
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);

    // Bootstrap persona categories & default budgets
    const persona = PERSONA_CONFIGS[newUser.segment] || PERSONA_CONFIGS.professional;
    const currentMonthStr = new Date().toISOString().substring(0, 7);

    persona.categories.forEach((catTpl, idx) => {
      const catId = `cat_${newUser.id}_${idx + 1}`;
      this.data.categories.push({
        id: catId,
        userId: newUser.id,
        name: catTpl.name,
        icon: catTpl.icon,
        color: catTpl.color,
        type: catTpl.type,
        isDefault: true,
      });

      if (catTpl.type === "expense" && catTpl.defaultBudget > 0) {
        this.data.budgets.push({
          id: `bgt_${catId}_${currentMonthStr}`,
          userId: newUser.id,
          categoryId: catId,
          month: currentMonthStr,
          limitAmount: catTpl.defaultBudget,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    this.save();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.users[idx];
  }

  // --- Category Operations ---

  public getCategoriesForUser(userId: string): Category[] {
    return this.data.categories.filter((c) => c.userId === userId);
  }

  public getCategoryById(id: string): Category | undefined {
    return this.data.categories.find((c) => c.id === id);
  }

  public createCategory(userId: string, category: Omit<Category, "id" | "userId">): Category {
    const newCat: Category = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      ...category,
    };
    this.data.categories.push(newCat);
    this.save();
    return newCat;
  }

  public updateCategory(id: string, userId: string, updates: Partial<Category>): Category | undefined {
    const idx = this.data.categories.findIndex((c) => c.id === id && c.userId === userId);
    if (idx === -1) return undefined;
    this.data.categories[idx] = {
      ...this.data.categories[idx],
      ...updates,
    };
    this.save();
    return this.data.categories[idx];
  }

  public deleteCategory(id: string, userId: string): boolean {
    const initialLen = this.data.categories.length;
    this.data.categories = this.data.categories.filter((c) => !(c.id === id && c.userId === userId));
    if (this.data.categories.length !== initialLen) {
      // Also cleanup associated budgets
      this.data.budgets = this.data.budgets.filter((b) => !(b.categoryId === id && b.userId === userId));
      this.save();
      return true;
    }
    return false;
  }

  public resetUserPersonaCategories(userId: string, segment: UserSegment, currentMonth: string): Category[] {
    // Remove existing categories & budgets
    this.data.categories = this.data.categories.filter((c) => c.userId !== userId);
    this.data.budgets = this.data.budgets.filter((b) => b.userId !== userId);

    const persona = PERSONA_CONFIGS[segment] || PERSONA_CONFIGS.professional;
    const newCats: Category[] = [];

    persona.categories.forEach((catTpl, idx) => {
      const catId = `cat_${userId}_${idx + 1}_${Date.now()}`;
      const cat: Category = {
        id: catId,
        userId,
        name: catTpl.name,
        icon: catTpl.icon,
        color: catTpl.color,
        type: catTpl.type,
        isDefault: true,
      };
      this.data.categories.push(cat);
      newCats.push(cat);

      if (catTpl.type === "expense" && catTpl.defaultBudget > 0) {
        this.data.budgets.push({
          id: `bgt_${catId}_${currentMonth}`,
          userId,
          categoryId: catId,
          month: currentMonth,
          limitAmount: catTpl.defaultBudget,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    this.save();
    return newCats;
  }

  // --- Transaction Operations with Encryption at Rest ---

  private createTransactionInternal(
    userId: string,
    txData: {
      date: string;
      categoryId: string;
      type: "expense" | "income";
      paymentMethod: DecryptedTransaction["paymentMethod"];
      amount: number;
      title: string;
      notes?: string;
      tags?: string[];
      receiptUrl?: string;
      isRecurring?: boolean;
    },
    customId?: string
  ): DecryptedTransaction {
    const id = customId || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Encrypt sensitive fields: amount, title, notes, tags, receiptUrl
    const payloadToEncrypt = {
      amount: Number(txData.amount),
      title: txData.title.trim(),
      notes: txData.notes?.trim() || "",
      tags: txData.tags || [],
      receiptUrl: txData.receiptUrl || "",
    };

    const encryptedPayload = encryptPayload(payloadToEncrypt);

    const encryptedRecord: EncryptedTransactionRecord = {
      id,
      userId,
      date: txData.date,
      categoryId: txData.categoryId,
      type: txData.type,
      paymentMethod: txData.paymentMethod,
      encryptedPayload,
      isRecurring: !!txData.isRecurring,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.transactions.push(encryptedRecord);

    const category = this.getCategoryById(txData.categoryId);

    return {
      id,
      userId,
      date: txData.date,
      categoryId: txData.categoryId,
      categoryName: category?.name || "Uncategorized",
      categoryIcon: category?.icon || "Tag",
      categoryColor: category?.color || "#94A3B8",
      type: txData.type,
      paymentMethod: txData.paymentMethod,
      amount: Number(txData.amount),
      title: txData.title,
      notes: txData.notes,
      tags: txData.tags,
      receiptUrl: txData.receiptUrl,
      isRecurring: !!txData.isRecurring,
      createdAt: encryptedRecord.createdAt,
      updatedAt: encryptedRecord.updatedAt,
      encrypted: true,
    };
  }

  public createTransaction(
    userId: string,
    txData: {
      date: string;
      categoryId: string;
      type: "expense" | "income";
      paymentMethod: DecryptedTransaction["paymentMethod"];
      amount: number;
      title: string;
      notes?: string;
      tags?: string[];
      receiptUrl?: string;
      isRecurring?: boolean;
    }
  ): DecryptedTransaction {
    const result = this.createTransactionInternal(userId, txData);
    this.save();
    return result;
  }

  public updateTransaction(
    id: string,
    userId: string,
    updates: Partial<{
      date: string;
      categoryId: string;
      type: "expense" | "income";
      paymentMethod: DecryptedTransaction["paymentMethod"];
      amount: number;
      title: string;
      notes?: string;
      tags?: string[];
      receiptUrl?: string;
      isRecurring?: boolean;
    }>
  ): DecryptedTransaction | undefined {
    const record = this.data.transactions.find((t) => t.id === id && t.userId === userId);
    if (!record) return undefined;

    // Decrypt existing payload
    const existing = decryptPayload<{
      amount: number;
      title: string;
      notes?: string;
      tags?: string[];
      receiptUrl?: string;
    }>(record.encryptedPayload);

    const newAmount = updates.amount !== undefined ? Number(updates.amount) : existing.amount;
    const newTitle = updates.title !== undefined ? updates.title.trim() : existing.title;
    const newNotes = updates.notes !== undefined ? updates.notes.trim() : existing.notes;
    const newTags = updates.tags !== undefined ? updates.tags : existing.tags;
    const newReceipt = updates.receiptUrl !== undefined ? updates.receiptUrl : existing.receiptUrl;

    const payloadToEncrypt = {
      amount: newAmount,
      title: newTitle,
      notes: newNotes,
      tags: newTags,
      receiptUrl: newReceipt,
    };

    record.encryptedPayload = encryptPayload(payloadToEncrypt);

    if (updates.date) record.date = updates.date;
    if (updates.categoryId) record.categoryId = updates.categoryId;
    if (updates.type) record.type = updates.type;
    if (updates.paymentMethod) record.paymentMethod = updates.paymentMethod;
    if (updates.isRecurring !== undefined) record.isRecurring = updates.isRecurring;
    record.updatedAt = new Date().toISOString();

    this.save();

    const category = this.getCategoryById(record.categoryId);

    return {
      id: record.id,
      userId: record.userId,
      date: record.date,
      categoryId: record.categoryId,
      categoryName: category?.name || "Uncategorized",
      categoryIcon: category?.icon || "Tag",
      categoryColor: category?.color || "#94A3B8",
      type: record.type,
      paymentMethod: record.paymentMethod,
      amount: newAmount,
      title: newTitle,
      notes: newNotes,
      tags: newTags,
      receiptUrl: newReceipt,
      isRecurring: record.isRecurring,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      encrypted: true,
    };
  }

  public deleteTransaction(id: string, userId: string): boolean {
    const initLen = this.data.transactions.length;
    this.data.transactions = this.data.transactions.filter((t) => !(t.id === id && t.userId === userId));
    if (this.data.transactions.length !== initLen) {
      this.save();
      return true;
    }
    return false;
  }

  public getTransactionsForUser(
    userId: string,
    filters?: {
      month?: string; // YYYY-MM
      startDate?: string;
      endDate?: string;
      categoryId?: string;
      type?: "expense" | "income";
      paymentMethod?: string;
      search?: string;
      minAmount?: number;
      maxAmount?: number;
    }
  ): DecryptedTransaction[] {
    const userCategories = this.getCategoriesForUser(userId);
    const catMap = new Map(userCategories.map((c) => [c.id, c]));

    const userRecords = this.data.transactions.filter((t) => t.userId === userId);

    const decryptedList: DecryptedTransaction[] = [];

    for (const rec of userRecords) {
      // Fast check for date filters before decrypting
      if (filters?.month && !rec.date.startsWith(filters.month)) continue;
      if (filters?.startDate && rec.date < filters.startDate) continue;
      if (filters?.endDate && rec.date > filters.endDate) continue;
      if (filters?.categoryId && rec.categoryId !== filters.categoryId) continue;
      if (filters?.type && rec.type !== filters.type) continue;
      if (filters?.paymentMethod && rec.paymentMethod !== filters.paymentMethod) continue;

      // Decrypt sensitive payload
      const decrypted = decryptPayload<{
        amount: number;
        title: string;
        notes?: string;
        tags?: string[];
        receiptUrl?: string;
      }>(rec.encryptedPayload);

      if (!decrypted || typeof decrypted.amount !== "number") continue;

      if (filters?.minAmount !== undefined && decrypted.amount < filters.minAmount) continue;
      if (filters?.maxAmount !== undefined && decrypted.amount > filters.maxAmount) continue;

      if (filters?.search) {
        const query = filters.search.toLowerCase();
        const titleMatch = decrypted.title.toLowerCase().includes(query);
        const notesMatch = decrypted.notes?.toLowerCase().includes(query);
        const tagMatch = decrypted.tags?.some((t) => t.toLowerCase().includes(query));
        const cat = catMap.get(rec.categoryId);
        const catMatch = cat?.name.toLowerCase().includes(query);

        if (!titleMatch && !notesMatch && !tagMatch && !catMatch) continue;
      }

      const category = catMap.get(rec.categoryId);

      decryptedList.push({
        id: rec.id,
        userId: rec.userId,
        date: rec.date,
        categoryId: rec.categoryId,
        categoryName: category?.name || "Uncategorized",
        categoryIcon: category?.icon || "Tag",
        categoryColor: category?.color || "#94A3B8",
        type: rec.type,
        paymentMethod: rec.paymentMethod,
        amount: decrypted.amount,
        title: decrypted.title,
        notes: decrypted.notes,
        tags: decrypted.tags,
        receiptUrl: decrypted.receiptUrl,
        isRecurring: rec.isRecurring,
        createdAt: rec.createdAt,
        updatedAt: rec.updatedAt,
        encrypted: true,
      });
    }

    // Sort by date descending, then createdAt descending
    return decryptedList.sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return b.createdAt.localeCompare(a.createdAt);
    });
  }

  // --- Budget Operations & Threshold Analytics ---

  public getBudgetsForUser(userId: string, month: string): CategoryBudget[] {
    return this.data.budgets.filter((b) => b.userId === userId && b.month === month);
  }

  public upsertCategoryBudget(userId: string, categoryId: string, month: string, limitAmount: number): CategoryBudget {
    const existingIdx = this.data.budgets.findIndex(
      (b) => b.userId === userId && b.categoryId === categoryId && b.month === month
    );

    if (existingIdx !== -1) {
      this.data.budgets[existingIdx].limitAmount = limitAmount;
      this.data.budgets[existingIdx].updatedAt = new Date().toISOString();
      this.save();
      return this.data.budgets[existingIdx];
    } else {
      const newBudget: CategoryBudget = {
        id: `bgt_${categoryId}_${month}_${Date.now()}`,
        userId,
        categoryId,
        month,
        limitAmount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.data.budgets.push(newBudget);
      this.save();
      return newBudget;
    }
  }

  public getOverallBudgetStatus(userId: string, month: string): any {
    const user = this.findUserById(userId);
    const alertThreshold = user?.alertThresholdPercent || 80;

    const categories = this.getCategoriesForUser(userId).filter((c) => c.type === "expense");
    const userBudgets = this.getBudgetsForUser(userId, month);
    const budgetMap = new Map(userBudgets.map((b) => [b.categoryId, b.limitAmount]));

    const monthTransactions = this.getTransactionsForUser(userId, { month });

    // Group spending by category
    const spentByCategory = new Map<string, number>();
    let totalSpent = 0;
    let totalIncome = 0;

    monthTransactions.forEach((tx) => {
      if (tx.type === "expense") {
        spentByCategory.set(tx.categoryId, (spentByCategory.get(tx.categoryId) || 0) + tx.amount);
        totalSpent += tx.amount;
      } else if (tx.type === "income") {
        totalIncome += tx.amount;
      }
    });

    // Date calculations for pace
    const [yearStr, mStr] = month.split("-");
    const year = parseInt(yearStr, 10);
    const m = parseInt(mStr, 10);
    const daysInMonth = new Date(year, m, 0).getDate();
    
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === m;
    const dayOfMonth = isCurrentMonth ? now.getDate() : (now > new Date(year, m - 1, daysInMonth) ? daysInMonth : 1);
    const daysRemaining = Math.max(0, daysInMonth - dayOfMonth);
    const expectedSpendPace = (dayOfMonth / daysInMonth) * 100;

    let totalBudgetLimit = 0;
    let activeAlertsCount = 0;

    const categoryStatuses = categories.map((cat) => {
      const limitAmount = budgetMap.get(cat.id) || 0;
      totalBudgetLimit += limitAmount;
      const spentAmount = spentByCategory.get(cat.id) || 0;
      const remainingAmount = limitAmount - spentAmount;
      const percentUsed = limitAmount > 0 ? (spentAmount / limitAmount) * 100 : (spentAmount > 0 ? 100 : 0);
      const isOverBudget = limitAmount > 0 && spentAmount > limitAmount;
      const isNearThreshold = limitAmount > 0 && percentUsed >= alertThreshold;

      if (isNearThreshold || isOverBudget) {
        activeAlertsCount++;
      }

      let paceStatus: 'on_track' | 'warning' | 'critical' = 'on_track';
      if (isOverBudget) {
        paceStatus = 'critical';
      } else if (percentUsed > expectedSpendPace + 15 || isNearThreshold) {
        paceStatus = 'warning';
      }

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        categoryIcon: cat.icon,
        categoryColor: cat.color,
        limitAmount,
        spentAmount,
        remainingAmount,
        percentUsed: Math.round(percentUsed * 10) / 10,
        isOverBudget,
        isNearThreshold,
        paceStatus,
      };
    });

    const overallPercentUsed = totalBudgetLimit > 0 ? (totalSpent / totalBudgetLimit) * 100 : 0;
    const paceDifference = overallPercentUsed - expectedSpendPace;

    return {
      month,
      totalBudgetLimit,
      totalSpent,
      totalIncome,
      netSavings: totalIncome - totalSpent,
      remainingBudget: totalBudgetLimit - totalSpent,
      overallPercentUsed: Math.round(overallPercentUsed * 10) / 10,
      dayOfMonth,
      daysInMonth,
      daysRemaining,
      expectedSpendPace: Math.round(expectedSpendPace * 10) / 10,
      paceDifference: Math.round(paceDifference * 10) / 10,
      categoryStatuses,
      activeAlertsCount,
      alertThresholdPercent: alertThreshold,
    };
  }

  // --- Monthly Analytics & Trends ---

  public getMonthlyReport(userId: string, month: string): any {
    const user = this.findUserById(userId);
    const currency = user?.currency || "$";
    const budgetStatus = this.getOverallBudgetStatus(userId, month);
    const transactions = this.getTransactionsForUser(userId, { month });

    // Previous month comparison
    const [yearStr, mStr] = month.split("-");
    const year = parseInt(yearStr, 10);
    const m = parseInt(mStr, 10);
    const prevMonthNum = m === 1 ? 12 : m - 1;
    const prevYear = m === 1 ? year - 1 : year;
    const prevMonthStr = `${prevYear}-${String(prevMonthNum).padStart(2, "0")}`;

    const prevTransactions = this.getTransactionsForUser(userId, { month: prevMonthStr });
    let prevTotalSpent = 0;
    let prevTotalIncome = 0;

    prevTransactions.forEach((tx) => {
      if (tx.type === "expense") prevTotalSpent += tx.amount;
      if (tx.type === "income") prevTotalIncome += tx.amount;
    });

    // Daily breakdown for timeline graph
    const daysInMonth = budgetStatus.daysInMonth;
    const dailyData: Array<{
      day: number;
      date: string;
      expense: number;
      income: number;
      cumulativeExpense: number;
    }> = [];

    let runningExpense = 0;
    const dayMap = new Map<number, { expense: number; income: number }>();

    transactions.forEach((tx) => {
      const day = parseInt(tx.date.split("-")[2], 10);
      const cur = dayMap.get(day) || { expense: 0, income: 0 };
      if (tx.type === "expense") cur.expense += tx.amount;
      if (tx.type === "income") cur.income += tx.amount;
      dayMap.set(day, cur);
    });

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${month}-${String(d).padStart(2, "0")}`;
      const entry = dayMap.get(d) || { expense: 0, income: 0 };
      runningExpense += entry.expense;
      dailyData.push({
        day: d,
        date: dateStr,
        expense: entry.expense,
        income: entry.income,
        cumulativeExpense: runningExpense,
      });
    }

    // Payment method distribution
    const paymentMethodBreakdown: Record<string, number> = {};
    transactions.filter((t) => t.type === "expense").forEach((tx) => {
      paymentMethodBreakdown[tx.paymentMethod] = (paymentMethodBreakdown[tx.paymentMethod] || 0) + tx.amount;
    });

    // Top single expenses
    const topExpenses = [...transactions.filter((t) => t.type === "expense")]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Burn rate and projections
    const daysElapsed = Math.max(1, budgetStatus.dayOfMonth);
    const averageDailyBurn = budgetStatus.totalSpent / daysElapsed;
    const projectedMonthEndSpend = averageDailyBurn * daysInMonth;

    // Spending difference vs prev month
    const spendDiffPercent = prevTotalSpent > 0 ? ((budgetStatus.totalSpent - prevTotalSpent) / prevTotalSpent) * 100 : 0;

    // Smart financial insights
    const insights: Array<{ type: 'positive' | 'warning' | 'neutral' | 'info'; title: string; message: string }> = [];

    if (budgetStatus.netSavings > 0) {
      const savingsRate = budgetStatus.totalIncome > 0 ? (budgetStatus.netSavings / budgetStatus.totalIncome) * 100 : 0;
      insights.push({
        type: 'positive',
        title: 'Healthy Positive Cash Flow',
        message: `You have saved ${currency}${budgetStatus.netSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${Math.round(savingsRate)}% savings rate) this month.`
      });
    } else if (budgetStatus.totalSpent > budgetStatus.totalIncome && budgetStatus.totalIncome > 0) {
      insights.push({
        type: 'warning',
        title: 'Deficit Warning',
        message: `Your monthly expenses exceed total income by ${currency}${(budgetStatus.totalSpent - budgetStatus.totalIncome).toLocaleString('en-US', { minimumFractionDigits: 2 })}.`
      });
    }

    const overBudgetCats = budgetStatus.categoryStatuses.filter((c: any) => c.isOverBudget);
    if (overBudgetCats.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Category Overspend Detected',
        message: `${overBudgetCats.map((c: any) => c.categoryName).join(', ')} have exceeded their allocated monthly budget.`
      });
    }

    if (spendDiffPercent < -5) {
      insights.push({
        type: 'positive',
        title: 'Spending Cut Achievement',
        message: `Spending is currently ${Math.abs(Math.round(spendDiffPercent))}% lower than this time last month.`
      });
    } else if (spendDiffPercent > 15) {
      insights.push({
        type: 'neutral',
        title: 'Spending Surge',
        message: `Spending velocity is ${Math.round(spendDiffPercent)}% higher than the previous month.`
      });
    }

    return {
      month,
      currency,
      summary: budgetStatus,
      prevMonthSummary: {
        month: prevMonthStr,
        totalSpent: prevTotalSpent,
        totalIncome: prevTotalIncome,
        netSavings: prevTotalIncome - prevTotalSpent,
      },
      spendDiffPercent: Math.round(spendDiffPercent * 10) / 10,
      dailyBreakdown: dailyData,
      paymentMethodBreakdown,
      topExpenses,
      analytics: {
        averageDailyBurn: Math.round(averageDailyBurn * 100) / 100,
        projectedMonthEndSpend: Math.round(projectedMonthEndSpend * 100) / 100,
        daysElapsed,
        daysInMonth,
      },
      insights,
    };
  }
}

export const db = new DatabaseService();
