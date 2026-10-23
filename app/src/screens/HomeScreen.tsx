import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { api, errorMessage } from "../api";
import type { Loan, Summary } from "../types";
import { formatRupees } from "../format";
import SummaryCard from "../components/SummaryCard";
import LoanItem from "../components/LoanItem";
import AddLoanModal from "../components/AddLoanModal";

type Props = { onLogout: () => void };

export default function HomeScreen({ onLogout }: Props) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [loansRes, summaryRes] = await Promise.all([
        api<Loan[]>("/loans"),
        api<Summary>("/summary"),
      ]);
      setLoans(loansRes);
      setSummary(summaryRes);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function confirmRepaid(loan: Loan) {
    Alert.alert(
      "Mark as repaid?",
      `${loan.friendName} paid back ${formatRupees(loan.amountPaise)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, repaid",
          onPress: async () => {
            try {
              await api(`/loans/${loan.id}/repay`, { method: "PATCH" });
              await load();
            } catch (e) {
              Alert.alert("Couldn't update", errorMessage(e));
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MiniLedger</Text>
        <Pressable onPress={onLogout} hitSlop={8}>
          <Text style={styles.logout}>Log out</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : error && !summary ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retry} onPress={refresh}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <LoanItem loan={item} onMarkRepaid={confirmRepaid} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListHeaderComponent={
            <>
              {error && <Text style={styles.banner}>{error}</Text>}
              {summary && <SummaryCard summary={summary} />}
              <Text style={styles.section}>Your loans</Text>
            </>
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No loans yet. Tap "+ Add loan" to get started.</Text>
          }
        />
      )}

      <Pressable style={styles.fab} onPress={() => setShowAdd(true)}>
        <Text style={styles.fabText}>+ Add loan</Text>
      </Pressable>

      <AddLoanModal visible={showAdd} onClose={() => setShowAdd(false)} onAdded={load} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 26, fontWeight: "700", color: "#0F172A" },
  logout: { color: "#2563EB", fontSize: 15 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  errorText: { color: "#DC2626", textAlign: "center", fontSize: 15 },
  retry: { marginTop: 16, backgroundColor: "#2563EB", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  retryText: { color: "#fff", fontWeight: "600" },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  banner: { backgroundColor: "#FEF2F2", color: "#DC2626", padding: 10, borderRadius: 8, marginBottom: 12 },
  section: { fontSize: 16, fontWeight: "600", color: "#334155", marginBottom: 10 },
  empty: { textAlign: "center", color: "#94A3B8", marginTop: 30 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 36,
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});