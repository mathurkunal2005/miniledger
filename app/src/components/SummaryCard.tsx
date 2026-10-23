import { View, Text, StyleSheet } from "react-native";
import type { Summary } from "../types";
import { formatRupees } from "../format";

export default function SummaryCard({ summary }: { summary: Summary }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Outstanding</Text>
      <Text style={styles.big}>{formatRupees(summary.outstandingPaise)}</Text>

      <View style={styles.row}>
        <Stat label="Total lent" paise={summary.totalLentPaise} />
        <Stat label="Repaid" paise={summary.totalRepaidPaise} />
        <Stat label="Overdue" paise={summary.overduePaise} danger />
      </View>
    </View>
  );
}

function Stat({ label, paise, danger }: { label: string; paise: number; danger?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, danger && paise > 0 && styles.danger]}>
        {formatRupees(paise)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#1E3A8A", borderRadius: 16, padding: 20, marginBottom: 20 },
  label: { color: "#BFDBFE", fontSize: 13 },
  big: { color: "#fff", fontSize: 34, fontWeight: "700", marginTop: 4 },
  row: { flexDirection: "row", marginTop: 18 },
  stat: { flex: 1 },
  statLabel: { color: "#BFDBFE", fontSize: 12 },
  statValue: { color: "#fff", fontSize: 16, fontWeight: "600", marginTop: 2 },
  danger: { color: "#FCA5A5" },
});
