import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { sendResetLink } from "../../firebaseconfig";
import colors from "../components/colors";

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSendReset = async () => {
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);
    try {
      await sendResetLink(email.trim());
      setSuccess("Reset link sent. Check your email.");
    } catch (err: any) {
      setError(err?.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

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
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Forgot password</Text>
            <Text style={styles.subtitle}>
              Enter your email to receive reset instructions
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

            {/* ─── Same compact & stable container as Register/Login ─── */}
            <View style={styles.errorContainer}>
              {success ? (
                <Text style={styles.successText}>{success}</Text>
              ) : (
                <Text style={styles.errorText}>{error || " "}</Text>
              )}
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
                onPress={handleSendReset}
                disabled={loading}
              >
                {loading ? (
                  <Text style={styles.buttonText}>Sending...</Text>
                ) : (
                  <Text style={styles.buttonText}>Send reset link</Text>
                )}
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.footerRow}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.linkText}>← Back</Text>
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
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "center",
  },
  header: {
    marginBottom: 36, // ← matched to Register/Login
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

  form: { gap: 24 },
  field: { gap: 8 },
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
      android: {
        elevation: 3,
      },
    }),
  },

  // ─── Same as Register & Login ───
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
  successText: {
    color: "#006600",
    fontSize: 15, // ← matched size for consistency
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
});

export default ForgotPasswordScreen;
