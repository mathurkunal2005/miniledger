import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { api, errorMessage } from "../api";

type Props = { onLoggedIn: (token: string) => void };

export default function LoginScreen({ onLoggedIn }: Props) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendOtp() {
    setError(null);
    setLoading(true);
    try {
      await api("/auth/send-otp", { method: "POST", body: { phone } });
      setStep("otp");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setError(null);
    setLoading(true);
    try {
      const res = await api<{ token: string }>("/auth/verify-otp", {
        method: "POST",
        body: { phone, code },
      });
      onLoggedIn(res.token);
    } catch (e) {
      setError(errorMessage(e));
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MiniLedger</Text>
      <Text style={styles.subtitle}>Track money you've lent to friends</Text>

      {step === "phone" ? (
        <>
          <Text style={styles.label}>Phone number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="10-digit mobile number"
            keyboardType="phone-pad"
            maxLength={10}
          />
          <Pressable
            style={[styles.button, (loading || phone.length !== 10) && styles.buttonDisabled]}
            onPress={sendOtp}
            disabled={loading || phone.length !== 10}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.label}>Enter the OTP sent to {phone}</Text>
          <Text style={styles.hint}>(Mock OTP: check the server log)</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="6-digit OTP"
            keyboardType="number-pad"
            maxLength={6}
          />
          <Pressable
            style={[styles.button, (loading || code.length !== 6) && styles.buttonDisabled]}
            onPress={verifyOtp}
            disabled={loading || code.length !== 6}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify & Login</Text>}
          </Pressable>
          <Pressable
            onPress={() => {
              setStep("phone");
              setCode("");
              setError(null);
            }}
          >
            <Text style={styles.link}>Change number</Text>
          </Pressable>
        </>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#F8FAFC" },
  title: { fontSize: 32, fontWeight: "700", color: "#0F172A" },
  subtitle: { fontSize: 15, color: "#64748B", marginTop: 4, marginBottom: 32 },
  label: { fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 8 },
  hint: { fontSize: 12, color: "#94A3B8", marginTop: -4, marginBottom: 8 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  button: { backgroundColor: "#2563EB", padding: 15, borderRadius: 10, alignItems: "center" },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { color: "#2563EB", textAlign: "center", marginTop: 16, fontSize: 14 },
  error: { color: "#DC2626", marginTop: 16, textAlign: "center" },
});
