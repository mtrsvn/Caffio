import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import colors from "../components/colors";
import { requestOtp } from "../utils/otp";

const RequestOtpScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequest() {
    setError(null);
    if (!email) return setError("Please enter your email.");
    setLoading(true);
    try {
      await requestOtp(email);
      navigation.navigate("VerifyOtp", { email });
    } catch (e: any) {
      setError(e?.message || "Failed to send code.");
    } finally {
      setLoading(false);
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
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Sign in with Email</Text>
            <Text style={styles.subtitle}>
              We'll send a 6‑digit code to your email
            </Text>
          </View>

          <View style={styles.form}>
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
                onPress={handleRequest}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.navbarBg} />
                ) : (
                  <Text style={styles.buttonText}>Send code</Text>
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
  content: { flex: 1, paddingHorizontal: 28, justifyContent: "center" },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: "700", color: colors.gradientEnd },
  subtitle: { fontSize: 14, color: colors.iconInactive, marginTop: 6 },
  form: { gap: 16 },
  label: {
    fontSize: 13,
    color: colors.iconInactive,
    marginLeft: 4,
    marginTop: 8,
  },
  input: {
    height: 52,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.gradientEnd,
    borderWidth: 1,
    borderColor: "rgba(78,52,46,0.12)",
  },
  errorContainer: {
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
  },
  errorText: { color: "#b00020", fontSize: 14, textAlign: "center" },
  buttonGradient: { borderRadius: 12, overflow: "hidden", marginTop: 8 },
  buttonTouch: { height: 50, justifyContent: "center", alignItems: "center" },
  buttonText: { color: colors.navbarBg, fontSize: 16, fontWeight: "600" },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  linkText: { fontSize: 14, color: colors.iconInactive },
});

export default RequestOtpScreen;
