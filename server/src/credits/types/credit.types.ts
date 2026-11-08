/**
 * Response shapes for customer credit (ADR 0035). All money is a 2-dp string.
 * Nothing derivable (agreed total, paid, outstanding, overdue) is stored; the
 * service computes it with `credit-math.ts`.
 */

export interface CreditSaleView {
  saleId: string;
  /** Unit code or quantity-product name, whichever applies. */
  imei: string | null;
  serialNumber: string | null;
  model: string;
  quantity: number | null;
  salePrice: string;
  returnedAt: Date | null;
}

export interface CreditInstalmentView {
  id: string;
  dueDate: Date;
  amount: string;
  paid: string;
  overdue: boolean;
}

export interface CreditPaymentView {
  id: string;
  accountCode: string;
  amount: string;
  occurredAt: Date;
  receivedBy: { id: string; name: string };
}

export interface CreditView {
  id: string;
  customer: { id: string; name: string; phone: string | null };
  createdBy: { id: string; name: string };
  note: string | null;
  createdAt: Date;
  sales: CreditSaleView[];
  instalments: CreditInstalmentView[];
  payments: CreditPaymentView[];
  /** Cash price of the goods = agreedTotal − markupAmount (ADR 0068). */
  cashPrice: string;
  /** One fixed, disclosed margin agreed up front; "0.00" = interest-free. */
  markupAmount: string;
  agreedTotal: string;
  paid: string;
  outstanding: string;
  overpaid: string;
  overdueAmount: string;
  settled: boolean;
}

export interface CreditListItem {
  id: string;
  customer: { id: string; name: string; phone: string | null };
  createdAt: Date;
  agreedTotal: string;
  paid: string;
  outstanding: string;
  overdueAmount: string;
  settled: boolean;
}

/** A customer's effective credit position, surfaced on the customer views. */
export interface CustomerCreditSummary {
  outstanding: string;
  overdueAmount: string;
  /** null = no cap (no own limit and no settings default). */
  effectiveLimit: string | null;
}

/** The report under the finance permission. */
export interface CreditReport {
  totalOutstanding: string;
  totalOverdue: string;
  customers: {
    customerId: string;
    name: string;
    phone: string | null;
    outstanding: string;
    overdueAmount: string;
  }[];
}

/** Everything a client needs to print the paper contract. */
export interface CreditContract {
  creditId: string;
  createdAt: Date;
  store: { name: string | null; address: string | null; phone: string | null };
  customer: { name: string; phone: string | null };
  goods: {
    description: string;
    imei: string | null;
    serialNumber: string | null;
    quantity: number | null;
    price: string;
  }[];
  /** Cash price of the goods, before the disclosed margin. */
  cashPrice: string;
  /** One fixed, disclosed margin agreed up front (ADR 0068). */
  markupAmount: string;
  agreedTotal: string;
  downPayment: string;
  instalments: { dueDate: Date; amount: string }[];
  /** The plain Islamic-finance statement: no interest, no late fee ever. */
  terms: string;
}

/** An overdue credit for the Telegram reminder. */
export interface OverdueCredit {
  creditId: string;
  customer: string;
  overdueAmount: number;
}
