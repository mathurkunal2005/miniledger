// Shapes of the data the server sends back
export type Loan = {
  id: string;
  friendName: string;
  amountPaise: number;
  dueDate: string;
  repaidAt: string | null;
  receiptUrl: string | null;
  createdAt: string;
  isOverdue: boolean;
};

export type Summary = {
  totalLentPaise: number;
  totalRepaidPaise: number;
  overduePaise: number;
  outstandingPaise: number;
};
