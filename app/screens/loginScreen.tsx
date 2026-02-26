import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Eye, EyeOff } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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
import colors from "../components/colors";

const LoginScreen = () => {
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scaleAnim = useState(new Animated.Value(1))[0];

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

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.82,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleRememberPress = () => {
    animatePress();
    setIsChecked((prev) => !prev);
  };

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
    <LinearGradient
      colors={[
        colors.pageGradientTopLeft,
        colors.pageGradientMid,
        colors.pageGradientBottomRight,
      ]}
      start={{ x: 0.08, y: 0 }}
      end={{ x: 0.92, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Login to continue your coffee journey
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor="rgba(78,52,46,0.5)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(78,52,46,0.5)"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <Eye size={20} color={colors.gradientEnd} />
                  ) : (
                    <EyeOff size={20} color={colors.gradientEnd} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.rememberMeRow}
              activeOpacity={1}
              onPress={handleRememberPress}
            >
              <Animated.View
                style={[
                  styles.checkboxWrapper,
                  { transform: [{ scale: scaleAnim }] },
                ]}
              >
                {isChecked ? (
                  <LinearGradient
                    colors={[colors.gradientStart, colors.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.checkboxChecked}
                  >
                    <Text style={styles.checkmark}>✓</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.checkboxUnchecked} />
                )}
              </Animated.View>

              <Text style={styles.rememberMeText}>Remember me</Text>
            </TouchableOpacity>

            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error || " "}</Text>
            </View>

            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <TouchableOpacity
                style={styles.buttonTouch}
                activeOpacity={0.8}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.navbarBg} />
                ) : (
                  <Text style={styles.buttonText}>Login</Text>
                )}
              </TouchableOpacity>
            </LinearGradient>

            <TouchableOpacity
              style={[styles.buttonTouch, styles.googleButton]}
              onPress={() => {
                setGoogleLoading(true);
                promptAsync();
              }}
              disabled={!request || googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator color="#4285F4" />
              ) : (
                <View style={styles.googleContent}>
                  <Image
                    source={require("../assets/google.png")}
                    style={styles.googleIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.googleButtonText}>
                    Log in with Google
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <ArrowLeft size={18} color={colors.iconInactive} />
                <Text style={styles.linkText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate("ForgotPassword")}
              >
                <Text style={styles.linkText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.signupRow}>
              <Text style={styles.helperText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={[styles.linkText, styles.underline]}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "center",
  },
  header: {
    marginBottom: 36,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: colors.gradientEnd,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: colors.iconInactive,
    marginTop: 6,
  },

  form: {
    gap: 24,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.iconInactive,
    marginLeft: 4,
  },
  input: {
    height: 52,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.gradientEnd,
    borderWidth: 1,
    borderColor: "rgba(78,52,46,0.12)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },

  rememberMeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  checkboxWrapper: {
    marginRight: 12,
  },
  checkboxUnchecked: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.iconInactive,
    opacity: 0.5,
  },
  checkboxChecked: {
    width: 20,
    height: 20,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  rememberMeText: {
    fontSize: 15,
    color: colors.iconInactive,
    fontWeight: "500",
  },

  errorContainer: {
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
  },
  errorText: {
    color: "#b00020",
    fontSize: 15,
    lineHeight: 20,
    textAlign: "center",
  },

  buttonGradient: {
    borderRadius: 16,
    overflow: "hidden",
  },
  buttonTouch: {
    height: 54,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: colors.navbarBg,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  googleButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DADCE0",
  },
  googleContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  googleButtonText: {
    color: "#1F1F1F",
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.1,
  },

  inputRow: {
    position: "relative",
  },
  inputWithIcon: {
    paddingRight: 48,
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    top: 16,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingHorizontal: 4,
  },
  linkText: {
    fontSize: 14,
    color: colors.iconInactive,
  },

  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 28,
  },
  helperText: {
    fontSize: 15,
    color: colors.iconInactive,
  },
  underline: {
    textDecorationLine: "underline",
  },
});

export default LoginScreen;
