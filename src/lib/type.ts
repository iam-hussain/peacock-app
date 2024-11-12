// Loan History structure
export type LoanHistoryEntry = {
  active: boolean; // Indicates if the loan is currently active
  amount: number; // Principal amount of the loan
  startDate: Date; // Date the loan started
  investDate: Date; // Date the loan was invested
  endDate?: Date; // Optional end date if the loan has been repaid
  interest: number; // Interest rate on the loan
  monthsPassed: number; // Number of months passed since the loan started
  daysPassed: number; // Number of days passed since the last monthly update
};

// Represents data for a member's passbook, tracking deposits, withdrawals, balances, and offsets
export type MemberPassbookData = {
  periodicDepositAmount: number; // Total amount periodically deposited by the member
  offsetDepositAmount: number; // Amount deposited for offset purposes by the member
  totalDepositAmount: number; // Sum of all deposits made by the member
  withdrawalAmount: number; // Total amount withdrawn by the member

  accountBalance: number; // Current balance in the member's account
  clubHeldAmount: number; // Portion of the member's balance that belongs to the club

  // Calculated Separately
  totalVendorOffsetAmount: number; // Total amount offset to vendors on behalf of the member
  totalLoanOffsetAmount: number; // Total amount offset to loans on behalf of the member

  // Loan Details
  totalLoanTaken: number; // Total amount of loans taken by the member
  totalLoanRepay: number; // Total amount of loans repaid by the member
  totalLoanBalance: number; // Current balance of outstanding loans
  totalInterestPaid: number; // Total interest paid by the member on loans
  loanHistory: LoanHistoryEntry[]; // Array of loan history entries
};

// Represents data for a vendor's passbook, tracking investments and returns
export type VendorPassbookData = {
  totalInvestment: number; // Total amount invested by the vendor
  totalReturns: number; // Total amount returned to the vendor
  profitEarned: number; // Profit earned from the vendor's investments
  accountBalance: number; // Current balance in the member's account
};

// Represents data for the club's passbook, tracking overall deposits, withdrawals, balances, investments, profits, and offsets
export type ClubPassbookData = {
  totalMemberPeriodicDeposits: number; // Total periodic deposits from all members to the club
  totalMemberOffsetDeposits: number; // Total offset deposits from all members to the club
  totalMemberWithdrawals: number; // Total amount withdrawn by members from the club

  currentClubBalance: number; // Current balance available in the club
  netClubBalance: number; // Net balance considering all deposits, withdrawals, and offsets

  // Vendor
  totalInvestment: number; // Total amount invested by all vendors in the club
  totalReturns: number; // Total returns accumulated by the club from investments
  totalProfit: number; // Total profit earned by the club from all investments

  // Loan Details
  totalLoanTaken: number; // Total amount of loans taken by the member
  totalLoanRepay: number; // Total amount of loans repaid by the member
  totalLoanBalance: number; // Current balance of outstanding loans
  totalInterestPaid: number; // Total interest paid by the member on loans

  // Calculated Separately
  totalLoanProfit: number; // Total profit earned by the club from loan-related activities
  totalVendorProfit: number; // Total profit earned by the club from vendor-related activities

  // Calculated Separately
  loanOffsetPaid: number; // Total amount of loan offsets paid by the club
  loanOffsetBalance: number; // Remaining balance of loan offsets to be paid by the club

  // Calculated Separately
  vendorOffsetPaid: number; // Total amount of vendor offsets paid by the club
  vendorOffsetBalance: number; // Remaining balance of vendor offsets to be paid by the club
};
