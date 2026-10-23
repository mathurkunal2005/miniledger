import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import LoginScreen from "./src/screens/LoginScreen";
import { setToken } from "./src/api";

export default function App() {
  const [token, setTokenState] = useState<string | null>(null);

  function handleLogin(newToken: string) {
    setToken(newToken); // for API calls
    setTokenState(newToken); // for showing the right screen
  }

  function handleLogout() {
    setToken(null);
    setTokenState(null);
  }

  return (
    <>
      <StatusBar style="dark" />
      {token ? (
        <View style={styles.placeholder}>
          <Text style={styles.text}>Logged in ✅</Text>
          <Pressable onPress={handleLogout}>
            <Text style={styles.link}>Log out</Text>
          </Pressable>
        </View>
      ) : (
        <LoginScreen onLoggedIn={handleLogin} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  placeholder: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  text: { fontSize: 22, fontWeight: "600" },
  link: { color: "#2563EB", marginTop: 16, fontSize: 16 },
});
