import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { api, errorMessage, uploadReceipt } from "../api";

type Props = {
  visible: boolean;
  onClose: () => void;
  onAdded: () => void;
};

// Date -> "2026-10-31" (in the phone's local time)
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export default function AddLoanModal({ visible, onClose, onAdded }: Props) {
  const [friendName, setFriendName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(daysFromToday(7));
  const [receipt, setReceipt] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setFriendName("");
    setAmount("");
    setDueDate(daysFromToday(7));
    setReceipt(null);
    setError(null);
    setSaving(false);
  }

  function close() {
    reset();
    onClose();
  }

  async function pickFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.6,
    });
    if (!result.canceled) setReceipt(result.assets[0]);
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError("Camera permission is needed to take a photo");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (!result.canceled) setReceipt(result.assets[0]);
  }

  // Check inputs on the phone first, for instant feedback
  function validate(): string | null {
    if (!friendName.trim()) return "Enter your friend's name";
    if (!/^\d+(\.\d{1,2})?$/.test(amount)) return "Enter a valid amount, like 500 or 250.50";
    if (Number(amount) <= 0) return "Amount must be more than 0";
        if (Number(amount) > 10_000_000) return "Amount can't be more than ₹1 crore";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || isNaN(new Date(dueDate).getTime())) {
      return "Enter the date as YYYY-MM-DD";
    }
    return null;
  }

  async function save() {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const loan = await api<{ id: string }>("/loans", {
        method: "POST",
        body: {
          friendName: friendName.trim(),
          amountPaise: Math.round(Number(amount) * 100),
          dueDate,
        },
      });

      // Loan is saved. Now upload the photo, if there is one.
      if (receipt) {
        try {
          await uploadReceipt(loan.id, receipt);
        } catch (e) {
          Alert.alert("Loan saved", `But the receipt couldn't be uploaded: ${errorMessage(e)}`);
        }
      }

      reset();
      onAdded();
      onClose();
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.outer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>New loan</Text>
            <Pressable onPress={close} hitSlop={8}>
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Friend's name</Text>
          <TextInput
            style={styles.input}
            value={friendName}
            onChangeText={setFriendName}
            placeholder="e.g. Rahul"
            autoCapitalize="words"
            maxLength={100}
          />

          <Text style={styles.label}>Amount (₹)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="e.g. 500"
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Due date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="2026-10-31"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
          <View style={styles.chips}>
            {[7, 15, 30].map((days) => (
              <Pressable key={days} style={styles.chip} onPress={() => setDueDate(daysFromToday(days))}>
                <Text style={styles.chipText}>+{days} days</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Receipt photo (optional)</Text>
          {receipt ? (
            <View style={styles.receiptRow}>
              <Image source={{ uri: receipt.uri }} style={styles.receiptPreview} />
              <Pressable onPress={() => setReceipt(null)} hitSlop={8}>
                <Text style={styles.remove}>Remove</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.receiptButtons}>
              <Pressable style={styles.chip} onPress={takePhoto}>
                <Text style={styles.chipText}>📷 Take photo</Text>
              </Pressable>
              <Pressable style={styles.chip} onPress={pickFromGallery}>
                <Text style={styles.chipText}>🖼️ Gallery</Text>
              </Pressable>
            </View>
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable style={[styles.button, saving && styles.buttonDisabled]} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save loan</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "700", color: "#0F172A" },
  cancel: { color: "#2563EB", fontSize: 15 },
  label: { fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 8 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  chips: { flexDirection: "row", marginTop: -6, marginBottom: 20 },
  chip: { backgroundColor: "#E0E7FF", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  chipText: { color: "#3730A3", fontSize: 13, fontWeight: "600" },
  receiptButtons: { flexDirection: "row", marginBottom: 20 },
  receiptRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  receiptPreview: { width: 72, height: 72, borderRadius: 8, marginRight: 16, backgroundColor: "#E2E8F0" },
  remove: { color: "#DC2626", fontSize: 14, fontWeight: "600" },
  error: { color: "#DC2626", marginBottom: 12 },
  button: { backgroundColor: "#2563EB", padding: 15, borderRadius: 10, alignItems: "center" },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});