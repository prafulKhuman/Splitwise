export type TransactionType = "income" | "expense";
export type CategoryKind = "fixed" | "variable";
export type SplitMethod = "equal" | "selected" | "custom";
export type GroupRole = "admin" | "member";
export type NotificationType = "settlement" | "contribution" | "expense" | "group" | "reminder";

export type Category = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  type: TransactionType;
  kind: CategoryKind;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  notes: string;
  splits?: TransactionSplit[];
  created_at: string;
};

export type TransactionSplit = {
  category: string;
  amount: number;
};

// Legacy alias
export type Expense = Transaction;

export type Group = {
  id: string;
  name: string;
  description: string;
  created_by: string;
  members: GroupMember[];
  member_uids: string[];
  settings: GroupSettings;
  created_at: string;
};

export type GroupMember = {
  uid: string;
  email: string;
  displayName: string;
  role: GroupRole;
  joined_at: string;
};

export type GroupSettings = {
  members_can_add: boolean;
  members_can_edit: boolean;
};

export type GroupTransaction = {
  id: string;
  group_id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes: string;
  paid_by: string;
  paid_by_name: string;
  split_method: SplitMethod;
  participants: SplitParticipant[];
  created_by: string;
  created_at: string;
};

export type SplitParticipant = {
  uid: string;
  displayName: string;
  amount: number;
};

export type MonthlyPool = {
  id: string;
  group_id: string;
  month: string; // YYYY-MM
  contribution_amount: number;
  contributions: PoolContribution[];
  expenses: PoolExpense[];
  is_active: boolean;
  created_at: string;
};

export type PoolContribution = {
  uid: string;
  displayName: string;
  amount: number;
  paid: boolean;
  paid_at?: string;
};

export type PoolExpense = {
  id: string;
  title: string;
  amount: number;
  date: string;
  paid_by: string;
  participants: string[]; // uids
  created_at: string;
};

export type Settlement = {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
};

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
};

export type AppNotification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  group_id?: string;
  created_at: string;
};
