import { View, Text, Pressable, StyleSheet } from "react-native";
import type { Loan } from "../types";
import { formatDate, formatRupees } from "../format";

type Props = { loan: Loan; onMarkRepaid: (loan: Loan) => void };

export default function LoanItem({ loan, onMarkRepaid }: Props) {
  const isRepaid = loan.repaidAt !== null;

  return (
    <View style={[styles.item, loan.isOverdue && styles.overdue, isRepaid && styles.repaid]}>
      <View style={styles.top}>
        <Text style={styles.name}>{loan.friendName}</Text>
        <Text style={[styles.amount, isRepaid && styles.strike]}>
          {formatRupees(loan.amountPaise)}
        </Text>
      </View>

      <View style={styles.bottom}>
        <Text style={[styles.due, loan.isOverdue && styles.dueOverdue]}>
          {isRepaid && loan.repaidAt
            ? `Repaid on ${formatDate(loan.repaidAt)}`
            : `Due ${formatDate(loan.dueDate)}`}
        </Text>

        {loan.isOverdue && <Text style={styles.badge}>OVERDUE</Text>}

        {!isRepaid && (
          <Pressable onPress={() => onMarkRepaid(loan)} hitSlop={8}>
            <Text style={styles.action}>Mark repaid</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#CBD5E1",
  },
  overdue: { backgroundColor: "#FEF2F2", borderLeftColor: "#DC2626" },
  repaid: { borderLeftColor: "#16A34A", opacity: 0.7 },
  top: { flexDirection: "row", justifyContent: "space-between" },
  name: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  amount: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  strike: { textDecorationLine: "line-through", color: "#64748B" },
  bottom: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  due: { flex: 1, fontSize: 13, color: "#64748B" },
  dueOverdue: { color: "#DC2626", fontWeight: "600" },
  badge: {
    backgroundColor: "#DC2626",
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 12,
    overflow: "hidden",
  },
  action: { color: "#2563EB", fontSize: 13, fontWeight: "600" },
});
