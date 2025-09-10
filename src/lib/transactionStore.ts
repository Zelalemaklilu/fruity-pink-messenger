export interface Transaction {
  id: string;
  type: "received" | "sent" | "request" | "add_money";
  amount: number;
  description: string;
  timestamp: string;
  date: string;
  status: "completed" | "pending" | "failed";
  recipient?: string;
  method?: string;
  note?: string;
  transactionId?: string;
}

class TransactionStore {
  private static instance: TransactionStore;
  private transactions: Transaction[] = [];

  private constructor() {
    this.loadTransactions();
  }

  public static getInstance(): TransactionStore {
    if (!TransactionStore.instance) {
      TransactionStore.instance = new TransactionStore();
    }
    return TransactionStore.instance;
  }

  private loadTransactions(): void {
    const stored = localStorage.getItem('transactions');
    if (stored) {
      this.transactions = JSON.parse(stored);
    } else {
      // Initialize with some mock data
      this.transactions = [
        {
          id: "1",
          type: "received",
          amount: 500.00,
          description: "Payment from Alex Johnson",
          timestamp: "2024-01-15 14:30",
          date: "2024-01-15",
          status: "completed",
          recipient: "Alex Johnson",
          transactionId: "TXN001"
        },
        {
          id: "2", 
          type: "sent",
          amount: 150.00,
          description: "Lunch payment",
          timestamp: "2024-01-14 12:15",
          date: "2024-01-14",
          status: "completed",
          recipient: "Sarah Williams",
          transactionId: "TXN002"
        },
        {
          id: "3",
          type: "add_money",
          amount: 1000.00,
          description: "Added money via Bank Transfer",
          timestamp: "2024-01-13 09:20",
          date: "2024-01-13", 
          status: "completed",
          method: "Bank Transfer",
          transactionId: "TXN003"
        }
      ];
      this.saveTransactions();
    }
  }

  private saveTransactions(): void {
    localStorage.setItem('transactions', JSON.stringify(this.transactions));
  }

  public addTransaction(transaction: Omit<Transaction, 'id' | 'timestamp' | 'date' | 'transactionId'>): Transaction {
    const now = new Date();
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      timestamp: now.toLocaleString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      date: now.toISOString().split('T')[0],
      transactionId: `TXN${Date.now()}`
    };

    this.transactions.unshift(newTransaction); // Add to beginning
    this.saveTransactions();
    return newTransaction;
  }

  public getTransactions(): Transaction[] {
    return [...this.transactions];
  }

  public getTransaction(id: string): Transaction | undefined {
    return this.transactions.find(t => t.id === id);
  }

  public getRecentTransactions(limit: number = 5): Transaction[] {
    return this.transactions.slice(0, limit);
  }
}

export const transactionStore = TransactionStore.getInstance();