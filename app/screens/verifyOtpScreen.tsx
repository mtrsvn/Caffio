import { useNavigation, useRoute } from "@react-navigation/native";
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
import {
    verifyOtpAndCompleteRegistration,
    verifyOtpAndSignIn,
} from "../utils/otp";

const VerifyOtpScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const emailFromParams = route.params?.email || "";

  const [email, setEmail] = useState(emailFromParams);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify() {
    setError(null);
    if (!email || !otp) return setError("Email and code are required.");
    setLoading(true);
    try {
      if (route.params?.mode === "register") {
        const username = route.params?.username || "";
        const password = route.params?.password || "";
        await verifyOtpAndCompleteRegistration(email, otp, username, password);
      } else {
        await verifyOtpAndSignIn(email, otp);
      }
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (e: any) {
      setError(e?.message || "Verification failed.");
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
            <Text style={styles.title}>Enter code</Text>
            <Text style={styles.subtitle}>
              Enter the 6‑digit code sent to your email
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

            <Text style={[styles.label, { marginTop: 12 }]}>Code</Text>
            <TextInput
              style={styles.input}
              placeholder="123456"
              placeholderTextColor="rgba(78,52,46,0.5)"
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              maxLength={6}
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
                onPress={handleVerify}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.navbarBg} />
                ) : (
                  <Text style={styles.buttonText}>Verify & Sign in</Text>
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
  label: { fontSize: 13, color: colors.iconInactive, marginLeft: 4 },
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

export default VerifyOtpScreen;
