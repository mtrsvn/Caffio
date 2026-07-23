import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Eye, EyeOff } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { addUserDoc, auth, loginWithEmail } from "../../firebaseconfig";
import { ThemeColors } from "../components/colors";
import { useTheme, useThemeStyles } from "../components/ThemeContext";

const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = useThemeStyles(getStyles);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId:
      "137243555767-5estidl9gmum8l4h713scni5iub0l49l.apps.googleusercontent.com",
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      handleGoogleToken(id_token);
    } else if (response?.type === "error") {
      setError("Google sign-in cancelled or failed.");
      setGoogleLoading(false);
    }
  }, [response]);

  async function handleLogin() {
    setError(null);
    if (!email || !password) {
      setError("Please fill out all fields.");
      return;
    }

    setLoading(true);
    try {
      await loginWithEmail(email.trim(), password);
      navigation.replace("Main");
    } catch (err: any) {
      const message = err?.message || "Login failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleToken(idToken: string) {
    setError(null);
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCred = await signInWithCredential(auth, credential);
      const uid = userCred.user.uid;
      await addUserDoc(uid, {
        email: userCred.user.email || "",
        username: userCred.user.displayName || "",
      });
      navigation.replace("Main");
    } catch (err: any) {
      setError(err.message || "Google authentication failed.");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.gradient}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Continue your coffee journey</Text>
        </View>

        <View style={styles.form}>
          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={colors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password */}
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                placeholder="••••••••"
                placeholderTextColor={colors.placeholder}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeButton}
              >
                {showPassword ? (
                  <Eye size={18} color={colors.textMuted} />
                ) : (
                  <EyeOff size={18} color={colors.textMuted} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Error */}
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error || " "}</Text>
          </View>

          {/* Login button */}
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* Google button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={() => { setGoogleLoading(true); promptAsync(); }}
            disabled={!request || googleLoading}
            activeOpacity={0.85}
          >
            {googleLoading ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <View style={styles.googleContent}>
                <Image
                  source={require("../assets/google.png")}
                  style={styles.googleIcon}
                  resizeMode="contain"
                />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Footer links */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <ArrowLeft size={16} color={colors.textMuted} />
              <Text style={styles.linkText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
              <Text style={styles.linkText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.signupRow}>
            <Text style={styles.helperText}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={[styles.linkText, styles.underline]}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  gradient: { flex: 1, backgroundColor: colors.bg },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "center",
  },

  // Header block
  header: { marginBottom: 36 },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 6,
  },

  form: { gap: 16 },
  field: { gap: 8 },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginLeft: 4,
  },

  // Input wrap (for password eye icon)
  inputWrap: {
    position: "relative",
  },
  input: {
    height: 52,
    backgroundColor: colors.inputBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.35 : 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  inputWithIcon: { paddingRight: 48 },
  eyeButton: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },

  errorContainer: {
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    textAlign: "center",
  },

  // Raised primary button
  primaryButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#C8BEB4",
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.65,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
    }),
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // Neumorphic Google button
  googleButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowDark,
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.55,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
  },
  googleContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  googleIcon: { width: 22, height: 22 },
  googleButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 4,
  },
  linkText: { fontSize: 13, color: colors.textMuted },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  helperText: { fontSize: 14, color: colors.textMuted },
  underline: { textDecorationLine: "underline" },

  // unused legacy (kept to avoid errors if referenced)
  safeArea: { flex: 1 },
  form2: { gap: 24 },
  inputRow: { position: "relative" },
  buttonGradient: { borderRadius: 16, overflow: "hidden" },
  buttonTouch: { height: 54, justifyContent: "center", alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

export default LoginScreen;
