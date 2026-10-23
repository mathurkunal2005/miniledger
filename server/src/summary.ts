type LoanLike = {
  amountPaise: number;
  dueDate: Date;
  repaidAt: Date | null;
};

export function calculateSummary(loans: LoanLike[], now: Date = new Date()) {
  let totalLentPaise = 0;
  let totalRepaidPaise = 0;
  let overduePaise = 0;

  for (const loan of loans) {
    totalLentPaise += loan.amountPaise;

    if (loan.repaidAt) {
      totalRepaidPaise += loan.amountPaise;
    } else if (loan.dueDate < now) {
      overduePaise += loan.amountPaise;
    }
  }

  return {
    totalLentPaise,
    totalRepaidPaise,
    overduePaise,
    outstandingPaise: totalLentPaise - totalRepaidPaise,
  };
}
