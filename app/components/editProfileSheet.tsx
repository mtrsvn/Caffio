import * as ImagePicker from "expo-image-picker";
import { Camera, X, User } from "lucide-react-native";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal
, TouchableOpacity} from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { removeUserAvatar, uploadUserAvatar, updateUserProfile } from "../../firebaseconfig";
import { AuthContext } from "./AuthProvider";
import { ThemeColors } from "./colors";
import { useThemeStyles, useTheme, ThemeMode } from "./ThemeContext";
import HapticTouchable from "./_HapticTouchable";

interface Props {
  visible: boolean;
  onClose: () => void;
  onExited?: () => void;
}

export default function EditProfileSheet({ visible, onClose, onExited }: Props) {
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useContext(AuthContext);
  const { mode, setMode, colors } = useTheme();
  const styles = useThemeStyles(getStyles);

  const [username, setUsername] = useState(user?.username || "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const sheetAnim = useRef(new Animated.Value(500)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [sheetHeight, setSheetHeight] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible && user) {
      setUsername(user.username || "");
    }
  }, [visible, user]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      const start = sheetHeight > 0 ? sheetHeight : 400;
      sheetAnim.setValue(start);
      backdropAnim.setValue(0);

      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(sheetAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 6,
          speed: 14,
        }),
      ]).start();
    } else if (mounted) {
      const to = sheetHeight > 0 ? sheetHeight : 400;
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 220,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sheetAnim, {
          toValue: to,
          duration: 240,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setMounted(false);
        if (onExited) onExited();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const onSheetLayout = (e: any) => {
    setSheetHeight(e.nativeEvent.layout.height);
  };

  const handleAvatarPress = () => {
    if (!user) return;
    const hasPhoto = !!user.photoUrl;
    const options: any = [
      { text: "Take a Photo", onPress: handleTakePhoto },
      { text: hasPhoto ? "Change Photo" : "Upload Photo", onPress: handleUploadPhoto },
      { text: "Cancel", style: "cancel" },
    ];
    if (hasPhoto) {
      options.splice(2, 0, {
        text: "Remove Photo",
        style: "destructive",
        onPress: handleRemovePhoto,
      });
    }
    Alert.alert("Profile Photo", "Choose an action", options, {
      cancelable: true,
    });
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Camera access is needed to take a photo.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadingAvatar(true);
        const localUri = result.assets[0].uri;
        await uploadUserAvatar(user!.uid, localUri);
        await refreshUser();
      }
    } catch (e) {
      console.error("Failed to take photo", e);
      Alert.alert("Error", "Something went wrong taking your photo.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUploadPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadingAvatar(true);
        const localUri = result.assets[0].uri;
        await uploadUserAvatar(user!.uid, localUri);
        await refreshUser();
      }
    } catch (e) {
      console.error("Failed to upload avatar", e);
      Alert.alert("Upload Failed", "Something went wrong uploading your photo.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setUploadingAvatar(true);
      await removeUserAvatar(user!.uid);
      await refreshUser();
    } catch (e) {
      console.error("Failed to remove avatar", e);
      Alert.alert("Remove Failed", "Something went wrong removing your photo.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!username.trim()) {
      Alert.alert("Error", "Username cannot be empty.");
      return;
    }

    try {
      setSaving(true);
      await updateUserProfile(user.uid, { username: username.trim() });
      await refreshUser();
      onClose();
    } catch (e) {
      console.error("Failed to update profile", e);
      Alert.alert("Save Failed", "Could not update your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  const backdropStyle = { opacity: backdropAnim };
  const tintOpacity = backdropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.22],
  });

  return (
    <Modal visible={visible || mounted} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle, { zIndex: 5 }]}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0.3)", opacity: tintOpacity },
          ]}
        />
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoid}
        pointerEvents="box-none"
      >
        <Animated.View
          onLayout={onSheetLayout}
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max((insets.bottom ?? 0) + 24, 34),
              transform: [{ translateY: sheetAnim }],
            },
          ]}
        >
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <HapticTouchable onPress={onClose} style={styles.closeButton}>
              <X size={17} color={colors.gradientStart} strokeWidth={3} />
            </HapticTouchable>
          </View>

          <View style={styles.avatarSection}>
            <HapticTouchable activeOpacity={0.8} onPress={handleAvatarPress}>
              <View style={styles.avatarWrap}>
                {uploadingAvatar ? (
                  <ActivityIndicator color={colors.accent} />
                ) : user?.photoUrl ? (
                  <Image
                    source={{ uri: user.photoUrl }}
                    style={{ width: 80, height: 80, borderRadius: 40 }}
                  />
                ) : (
                  <User size={36} color={colors.accent} />
                )}
                <View style={styles.cameraIcon}>
                  <Camera size={14} color="#fff" />
                </View>
              </View>
            </HapticTouchable>
            <Text style={styles.changePhotoText}>Tap to change photo</Text>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
              placeholderTextColor="rgba(78,52,46,0.45)"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Appearance</Text>
            <View style={styles.themeToggleRow}>
              {(["system", "light", "dark"] as ThemeMode[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  activeOpacity={0.8}
                  onPress={() => setMode(t)}
                  style={[styles.themeOption, mode === t && styles.themeOptionActive]}
                >
                  <Text style={[styles.themeOptionText, mode === t && styles.themeOptionTextActive]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <HapticTouchable
            style={[
              styles.saveButton,
              saving || uploadingAvatar ? styles.saveButtonDisabled : null,
            ]}
            onPress={handleSave}
            disabled={saving || uploadingAvatar}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </HapticTouchable>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.navbarBg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.navbarBorder,
    zIndex: 10,
    ...Platform.select({
      android: {  },
      ios: {
        shadowColor: "#000",
        shadowOpacity: isDark ? 0.3 : 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: -2 },
      },
    }),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  headerTitle: { fontSize: 16, color: colors.textSecondary, fontFamily: "FunnelSans_700Bold" },
  closeButton: { padding: 6 },
  avatarSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderWidth: 2,
    borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
  },
  cameraIcon: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: colors.accent,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  changePhotoText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.accent,
    fontFamily: "FunnelSans_700Bold",
  },
  inputSection: {
    marginBottom: 32,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontFamily: "FunnelSans_700Bold",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    borderRadius: 14,
    backgroundColor: colors.coffeeTypeUnselectedBg,
    borderWidth: 1,
    borderColor: colors.coffeeTypeUnselectedBorder,
    color: colors.coffeeTypeUnselectedText,
    fontFamily: "FunnelSans_600SemiBold",
    fontSize: 16,
  },
  themeToggleRow: {
    flexDirection: "row",
    backgroundColor: colors.coffeeTypeUnselectedBg,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.coffeeTypeUnselectedBorder,
  },
  themeOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  themeOptionActive: {
    backgroundColor: colors.accent,
  },
  themeOptionText: {
    fontSize: 14,
    color: colors.textMuted,
    fontFamily: "FunnelSans_600SemiBold",
  },
  themeOptionTextActive: {
    color: "#fff",
    fontFamily: "FunnelSans_700Bold",
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "FunnelSans_700Bold",
  },
});
