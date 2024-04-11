interface BaseExpense {
    date: string; // "YYYY-MM-DD"
    time: string; // "HH:MM"
    type: string;
    item: string;
    expenditure?: number | null;
}

interface ProductExpense extends BaseExpense {
    type: "product";
    manufactureDate?: string | null;
    expiryDate?: string | null;
    brand?: string | null;
};

interface ActivityExpense extends BaseExpense {
    type: "activity";
    duration?: number | null;
    startDate?: number | null;
    endDate?: number | null;
    company?: string | null;

}

type Expense = ProductExpense | ActivityExpense;