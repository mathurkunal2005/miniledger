import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
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
        <HomeScreen onLogout={handleLogout} />
      ) : (
        <LoginScreen onLoggedIn={handleLogin} />
      )}
    </>
  );
}
