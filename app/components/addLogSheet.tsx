import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Camera, Star, X } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Animated,
    Easing,
    Keyboard,
    LayoutChangeEvent,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "./colors";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const CAFES = [
  "Starbucks",
  "Dunkin'",
  "Krispy Kreme",
  "Blue Bottle",
  "Peet's Coffee",
  "Tim Hortons",
  "Costa Coffee",
  "Custom Cafe",
];

const COFFEE_TYPES = [
  "Espresso",
  "Latte",
  "Cappuccino",
  "Americano",
  "Mocha",
  "Macchiato",
  "Flat White",
  "Cold Brew",
];

const TASTE_PROFILE = [
  "Bold",
  "Smooth",
  "Sweet",
  "Bitter",
  "Creamy",
  "Fruity",
  "Nutty",
  "Chocolatey",
];

export default function AddLogSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();

  // selection state
  const [selectedCafe, setSelectedCafe] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedTaste, setSelectedTaste] = useState<string[]>([]);
  const [rating, setRating] = useState<number>(0);

  // custom input modes & values
  const [customCafeMode, setCustomCafeMode] = useState(false);
  const [customCafeText, setCustomCafeText] = useState("");
  const customCafeRef = useRef<TextInput | null>(null);

  const [customTypeMode, setCustomTypeMode] = useState(false);
  const [customTypeText, setCustomTypeText] = useState("");
  const customTypeRef = useRef<TextInput | null>(null);

  // animation values
  const sheetAnim = useRef(new Animated.Value(0)).current; // translateY for sheet
  const backdropAnim = useRef(new Animated.Value(0)).current; // opacity for blur + tint
  const [sheetHeight, setSheetHeight] = useState(0);
  const [mounted, setMounted] = useState(false);

  // mount + animate in/out
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
        Animated.timing(sheetAnim, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (customCafeMode) customCafeRef.current?.focus();
        if (customTypeMode) customTypeRef.current?.focus();
      });
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
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setMounted(false);
        // reset custom modes when sheet fully closed
        setCustomCafeMode(false);
        setCustomTypeMode(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, sheetHeight]);

  // autofocus when entering custom modes
  useEffect(() => {
    if (customCafeMode) {
      const t = setTimeout(() => customCafeRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [customCafeMode]);

  useEffect(() => {
    if (customTypeMode) {
      const t = setTimeout(() => customTypeRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [customTypeMode]);

  const toggleTaste = (t: string) => {
    setSelectedTaste((prev) =>
      prev.includes(t) ? prev.filter((p) => p !== t) : [...prev, t],
    );
  };

  const selectType = (t: string) => {
    // selecting a normal pill exits custom type mode
    setCustomTypeMode(false);
    setSelectedType((prev) => (prev === t ? null : t));
  };

  const selectCafe = (c: string) => {
    // selecting a normal cafe pill exits custom cafe mode
    setCustomCafeMode(false);
    setSelectedCafe((prev) => (prev === c ? null : c));
  };

  // capture sheet height for animation
  const onSheetLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h && h > 0 && h !== sheetHeight) setSheetHeight(h);
  };

  // Helpers to render pills / custom inputs

  const renderCafePill = (c: string) => {
    const selected = selectedCafe === c;
    const isCustom = c === "Custom Cafe";

    if (isCustom) {
      // custom mode: show full-width input above coffee type (persistent)
      if (customCafeMode) {
        return (
          <View key="custom-cafe-input" style={{ marginBottom: 8 }}>
            <Text style={styles.fieldLabel}>Cafe</Text>
            <TextInput
              ref={customCafeRef}
              value={customCafeText}
              onChangeText={setCustomCafeText}
              placeholder="Enter cafe name"
              placeholderTextColor="rgba(78,52,46,0.45)"
              style={styles.fullInput}
              returnKeyType="done"
              onSubmitEditing={() => {
                const text = customCafeText.trim();
                if (text.length) setSelectedCafe(text);
                setCustomCafeMode(false);
                Keyboard.dismiss();
              }}
              // NOTE: do NOT hide on blur — input stays persistent
            />
            <TouchableOpacity
              onPress={() => {
                // switch back to list mode without submitting
                setCustomCafeMode(false);
                setCustomCafeText("");
              }}
              activeOpacity={0.8}
              style={{ marginTop: 8 }}
            >
              <Text style={styles.chooseFromList}>
                Choose from list instead
              </Text>
            </TouchableOpacity>
          </View>
        );
      }

      // default dashed pill that opens custom input mode
      return (
        <TouchableOpacity
          key={c}
          onPress={() => {
            setCustomCafeText("");
            setCustomCafeMode(true);
            setSelectedCafe(null);
          }}
          activeOpacity={0.85}
          style={[styles.pillAdd, { margin: 6 }]}
        >
          <Text style={styles.pillAddText}>Custom Cafe</Text>
        </TouchableOpacity>
      );
    }

    if (selected) {
      return (
        <TouchableOpacity
          key={c}
          onPress={() => selectCafe(c)}
          activeOpacity={0.85}
          style={{ margin: 6 }}
        >
          <LinearGradient
            colors={[
              colors.tasteSelectedGradientStart,
              colors.tasteSelectedGradientEnd,
            ]}
            start={[0, 0]}
            end={[1, 1]}
            style={styles.pillSelected}
          >
            <Text style={styles.pillSelectedText}>{c}</Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={c}
        onPress={() => selectCafe(c)}
        activeOpacity={0.85}
        style={[styles.pillUnselectedCoffee, { margin: 6 }]}
      >
        <Text style={styles.pillUnselectedCoffeeText}>{c}</Text>
      </TouchableOpacity>
    );
  };

  const renderCoffeeTypePill = (t: string) => {
    const selected = selectedType === t;
    if (selected) {
      return (
        <TouchableOpacity
          key={t}
          onPress={() => selectType(t)}
          activeOpacity={0.85}
          style={{ margin: 6 }}
        >
          <LinearGradient
            colors={[
              colors.tasteSelectedGradientStart,
              colors.tasteSelectedGradientEnd,
            ]}
            start={[0, 0]}
            end={[1, 1]}
            style={styles.pillSelected}
          >
            <Text style={styles.pillSelectedText}>{t}</Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={t}
        onPress={() => selectType(t)}
        activeOpacity={0.85}
        style={[styles.pillUnselectedCoffee, { margin: 6 }]}
      >
        <Text style={styles.pillUnselectedCoffeeText}>{t}</Text>
      </TouchableOpacity>
    );
  };

  const renderCoffeeTypeCustomInput = () => {
    if (customTypeMode) {
      return (
        <View key="__custom_type_input" style={{ marginBottom: 8 }}>
          <Text style={styles.fieldLabel}>Coffee Type</Text>
          <TextInput
            ref={customTypeRef}
            value={customTypeText}
            onChangeText={setCustomTypeText}
            placeholder="Enter coffee type"
            placeholderTextColor="rgba(78,52,46,0.45)"
            style={styles.fullInput}
            returnKeyType="done"
            onSubmitEditing={() => {
              const text = customTypeText.trim();
              if (text.length) setSelectedType(text);
              setCustomTypeMode(false);
              Keyboard.dismiss();
            }}
            // NOTE: do NOT hide on blur — input stays persistent
          />
          <TouchableOpacity
            onPress={() => {
              setCustomTypeMode(false);
              setCustomTypeText("");
            }}
            activeOpacity={0.8}
            style={{ marginTop: 8 }}
          >
            <Text style={styles.chooseFromList}>Choose from list instead</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <TouchableOpacity
        key="__custom_type_plus"
        style={[styles.pillAdd, { margin: 6 }]}
        onPress={() => {
          setCustomTypeText("");
          setCustomTypeMode(true);
          setSelectedType(null);
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.pillAddText}>+</Text>
      </TouchableOpacity>
    );
  };

  const renderTastePill = (t: string) => {
    const selected = selectedTaste.includes(t);
    if (selected) {
      return (
        <TouchableOpacity
          key={t}
          onPress={() => toggleTaste(t)}
          activeOpacity={0.85}
          style={{ margin: 6 }}
        >
          <LinearGradient
            colors={[
              colors.tasteSelectedGradientStart,
              colors.tasteSelectedGradientEnd,
            ]}
            start={[0, 0]}
            end={[1, 1]}
            style={styles.pillSelected}
          >
            <Text style={styles.pillSelectedText}>{t}</Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    // use coffee-type/cafe unselected style
    return (
      <TouchableOpacity
        key={t}
        onPress={() => toggleTaste(t)}
        activeOpacity={0.85}
        style={[styles.pillUnselectedCoffee, { margin: 6 }]}
      >
        <Text style={styles.pillUnselectedCoffeeText}>{t}</Text>
      </TouchableOpacity>
    );
  };

  const stars = useMemo(() => [1, 2, 3, 4, 5], []);

  // Determine whether submit should be enabled.
  // Consider custom input text as a valid value even before submit if user is typing.
  const finalCafeValue =
    selectedCafe ??
    (customCafeMode && customCafeText.trim() ? customCafeText.trim() : null);
  const finalTypeValue =
    selectedType ??
    (customTypeMode && customTypeText.trim() ? customTypeText.trim() : null);
  const canSubmit = Boolean(finalCafeValue && finalTypeValue && rating > 0);

  // Save handler: commit custom text (if any) and close
  const handleSave = () => {
    if (!canSubmit) return;

    // commit values into state (so they persist if parent reads state later)
    if (customCafeMode && customCafeText.trim()) {
      setSelectedCafe(customCafeText.trim());
    }
    if (customTypeMode && customTypeText.trim()) {
      setSelectedType(customTypeText.trim());
    }

    // close and reset modes
    onClose();
    setCustomCafeMode(false);
    setCustomTypeMode(false);
  };

  // do not render until mounted
  if (!mounted) return null;

  // animated styles
  const backdropStyle = { opacity: backdropAnim };
  const tintOpacity = backdropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.22],
  });

  return (
    <Modal
      visible={mounted}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Animated blur backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <BlurView
            intensity={100}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
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

        {/* Animated sheet */}
        <Animated.View
          onLayout={onSheetLayout}
          style={[
            styles.sheet,
            {
              paddingBottom: (insets.bottom ?? 12) + 12,
              transform: [{ translateY: sheetAnim }],
            },
          ]}
        >
          {/* Header with title and close */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Add Coffee Purchase</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              activeOpacity={0.85}
            >
              {/* Changed: plain X icon with no background */}
              <X size={18} color={colors.gradientStart} strokeWidth={3} />
            </TouchableOpacity>
          </View>

          <View style={styles.sheetDivider} />

          <ScrollView
            contentContainerStyle={styles.sheetBody}
            keyboardShouldPersistTaps="handled"
          >
            {/* Cafes / Custom input */}
            <View style={{ marginBottom: customCafeMode ? 6 : 0 }}>
              {/* Added extra top margin for Cafe label */}
              {!customCafeMode && (
                <Text style={[styles.sectionTitle, { marginTop: 12 }]}>
                  Cafe
                </Text>
              )}
              {!customCafeMode && (
                <View style={styles.pillRow}>
                  {CAFES.map((c) => renderCafePill(c))}
                </View>
              )}
              {customCafeMode && renderCafePill("Custom Cafe")}
            </View>

            {/* Coffee Type / Custom input */}
            {!customTypeMode && (
              <Text style={[styles.sectionTitle, { marginTop: 12 }]}>
                Coffee Type
              </Text>
            )}
            {!customTypeMode && (
              <View style={styles.pillRow}>
                {COFFEE_TYPES.map((t) => renderCoffeeTypePill(t))}
                {renderCoffeeTypeCustomInput()}
              </View>
            )}
            {customTypeMode && renderCoffeeTypeCustomInput()}

            {/* Taste Profile */}
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
              Taste Profile (optional lang)
            </Text>
            <View style={styles.pillRow}>
              {TASTE_PROFILE.map((t) => renderTastePill(t))}
            </View>

            {/* Rating */}
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Rating</Text>
            <View style={styles.starsRow}>
              {stars.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setRating((prev) => (prev === s ? 0 : s))}
                  style={styles.starButton}
                  activeOpacity={0.8}
                >
                  {rating >= s ? (
                    <Star
                      size={26}
                      color={colors.gradientStart}
                      fill={colors.gradientStart}
                      strokeWidth={0}
                    />
                  ) : (
                    <Star size={26} color={"#DDD"} strokeWidth={1.6} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Photo */}
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
              Photo (optional)
            </Text>
            <TouchableOpacity
              style={styles.photoBox}
              activeOpacity={0.8}
              onPress={() => {}}
            >
              <View style={styles.photoInner}>
                <Camera size={36} color={colors.gradientStart} />
                <Text style={styles.photoText}>Add Photo</Text>
              </View>
            </TouchableOpacity>

            {/* Action button */}
            <View style={{ height: 12 }} />
            <TouchableOpacity
              style={[
                styles.actionButton,
                !canSubmit && styles.actionButtonDisabled,
              ]}
              activeOpacity={0.9}
              onPress={handleSave}
              disabled={!canSubmit}
            >
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={[0, 0]}
                end={[1, 1]}
                style={styles.actionButtonInner}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: colors.iconActive },
                  ]}
                >
                  Add Coffee
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, zIndex: 5 },
  sheet: {
    backgroundColor: colors.navbarBg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: "hidden",
    maxHeight: "78%",
    paddingTop: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.navbarBorder,
    zIndex: 10,
    ...Platform.select({
      android: { elevation: 6 },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: -2 },
      },
    }),
  },

  /* Header */
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  headerTitle: { fontSize: 16, color: "#4E342E", fontWeight: "700" },
  closeButton: { padding: 6 },

  sheetDivider: { height: 1, backgroundColor: colors.navbarBorder },

  sheetBody: { paddingBottom: 24 },

  sectionTitle: { color: "#4E342E", fontWeight: "700", marginBottom: 8 },

  pillRow: { flexDirection: "row", flexWrap: "wrap" },

  pillSelected: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  pillSelectedText: { color: "#fff", fontWeight: "600" },

  pillUnselected: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.pillUnselectedBg,
    alignItems: "center",
    justifyContent: "center",
    margin: 6,
  },
  pillUnselectedText: { color: "#4E342E", fontWeight: "600" },

  pillUnselectedCoffee: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.coffeeTypeUnselectedBg,
    alignItems: "center",
    justifyContent: "center",
    margin: 6,
    borderWidth: 1,
    borderColor: colors.coffeeTypeUnselectedBorder,
  },
  pillUnselectedCoffeeText: {
    color: colors.coffeeTypeUnselectedText,
    fontWeight: "600",
  },

  pillAdd: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.coffeeTypeUnselectedBorder,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  pillAddText: {
    color: colors.coffeeTypeUnselectedText,
    fontSize: 14,
    fontWeight: "400",
  },

  /* Full-width input used for Custom Cafe / Custom Type */
  fieldLabel: { color: "#4E342E", fontWeight: "700", marginBottom: 8 },
  fullInput: {
    width: "100%",
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    borderRadius: 12,
    backgroundColor: colors.coffeeTypeUnselectedBg,
    borderWidth: 1,
    borderColor: colors.coffeeTypeUnselectedBorder,
    color: colors.coffeeTypeUnselectedText,
    fontWeight: "600",
  },
  chooseFromList: {
    color: colors.gradientStart,
    marginTop: 6,
    textDecorationLine: "underline",
    fontSize: 13,
  },

  helperText: {
    color: "#7a6059",
    fontSize: 13,
    marginTop: 10,
    textAlign: "center",
  },

  starsRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  starButton: { marginRight: 8 },

  photoBox: {
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: colors.navbarBorder,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  photoInner: { alignItems: "center" },
  photoText: { color: colors.gradientStart, fontWeight: "600", marginTop: 8 },

  actionButton: { marginTop: 12, borderRadius: 12, overflow: "hidden" },
  actionButtonDisabled: { opacity: 0.45 },
  actionButtonInner: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: { fontWeight: "700", fontSize: 16 },
});
