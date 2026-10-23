import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import { setToken, setOnUnauthorized } from "./src/api";

const TOKEN_KEY = "miniledger_token";

export default function App() {
  const [token, setTokenState] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // On app start: look for a saved token
  useEffect(() => {
    SecureStore.getItemAsync(TOKEN_KEY)
      .then((saved) => {
        if (saved) {
          setToken(saved);
          setTokenState(saved);
        }
      })
      .finally(() => setChecking(false));
  }, []);

  // If the server rejects our token, log out automatically
  useEffect(() => {
    setOnUnauthorized(() => {
      handleLogout();
    });
    return () => setOnUnauthorized(null);
  }, []);

  async function handleLogin(newToken: string) {
    setToken(newToken);
    setTokenState(newToken);
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
  }

  async function handleLogout() {
    setToken(null);
    setTokenState(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }

  // While checking storage, show a spinner instead of flashing the login screen
  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      {token ? (
        <HomeScreen onLogout={handleLogout} />
      ) : (
        <LoginScreen onLoggedIn={handleLogin} />
      )}
    </>
  );
}