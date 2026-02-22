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
  "Krispy Kreme",
  "Dunkin'",
  "Tim Hortons",
  "The Coffee Bean & Tea Leaf",
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

// Chocolatey next to Nutty
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

  // Per-item scale Animated.Values stored by key (category:name)
  const scalesRef = useRef<Record<string, Animated.Value>>({});

  // helpers to get/create scale Animated.Value for a pill/star
  const getScale = (category: string, name: string) => {
    const key = `${category}:${name}`;
    if (!scalesRef.current[key]) {
      scalesRef.current[key] = new Animated.Value(1);
    }
    return scalesRef.current[key];
  };

  // animate scale to a target (spring)
  const animateTo = (animated: Animated.Value, toValue: number) => {
    Animated.spring(animated, {
      toValue,
      useNativeDriver: true,
      friction: 8,
      tension: 120,
    }).start();
  };

  // press-in effect (quick shrink)
  const pressIn = (animated: Animated.Value) => {
    Animated.timing(animated, {
      toValue: 0.94,
      duration: 80,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  // press-out effect: spring to target (selected => slightly larger, else normal)
  const pressOutTo = (animated: Animated.Value, target = 1) => {
    Animated.spring(animated, {
      toValue: target,
      useNativeDriver: true,
      friction: 7,
      tension: 160,
    }).start();
  };

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

  // selection handlers with press-effect animations

  const toggleTaste = (t: string) => {
    const isSelected = selectedTaste.includes(t);
    const scale = getScale("taste", t);
    // press-in + press-out to final target
    pressIn(scale);
    const nextSelected = !isSelected;
    pressOutTo(scale, nextSelected ? 1.03 : 1);
    setSelectedTaste((prev) =>
      isSelected ? prev.filter((p) => p !== t) : [...prev, t],
    );
  };

  const selectType = (t: string) => {
    const prevSelected = selectedType;
    const nextSelected = prevSelected === t ? null : t;

    const tappedScale = getScale("type", t);
    pressIn(tappedScale);
    pressOutTo(tappedScale, nextSelected ? 1.03 : 1);

    if (prevSelected && prevSelected !== t) {
      const prevScale = getScale("type", prevSelected);
      animateTo(prevScale, 1);
    }

    setCustomTypeMode(false);
    setSelectedType((prev) => (prev === t ? null : t));
  };

  const selectCafe = (c: string) => {
    const prevSelected = selectedCafe;
    const nextSelected = prevSelected === c ? null : c;

    const tappedScale = getScale("cafe", c);
    pressIn(tappedScale);
    pressOutTo(tappedScale, nextSelected ? 1.03 : 1);

    if (prevSelected && prevSelected !== c) {
      const prevScale = getScale("cafe", prevSelected);
      animateTo(prevScale, 1);
    }

    setCustomCafeMode(false);
    setSelectedCafe((prev) => (prev === c ? null : c));
  };

  // ensure scales reflect selection state on changes
  useEffect(() => {
    CAFES.forEach((c) => {
      const scale = getScale("cafe", c);
      const isSelected = selectedCafe === c;
      animateTo(scale, isSelected ? 1.03 : 1);
    });

    COFFEE_TYPES.forEach((t) => {
      const scale = getScale("type", t);
      const isSelected = selectedType === t;
      animateTo(scale, isSelected ? 1.03 : 1);
    });

    TASTE_PROFILE.forEach((tp) => {
      const scale = getScale("taste", tp);
      const isSelected = selectedTaste.includes(tp);
      animateTo(scale, isSelected ? 1.03 : 1);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCafe, selectedType, selectedTaste]);

  // capture sheet height for animation
  const onSheetLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h && h > 0 && h !== sheetHeight) setSheetHeight(h);
  };

  // STAR animations: scale per star, press effect
  useEffect(() => {
    const stars = [1, 2, 3, 4, 5];
    stars.forEach((s) => {
      const scale = getScale("star", String(s));
      const isActive = rating >= s;
      // active stars slightly larger (keep consistent with pills) — star size also reduced below
      animateTo(scale, isActive ? 1.12 : 1);
    });
  }, [rating]);

  // Render helpers that use Animated.View for scale
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  const renderCafePill = (c: string) => {
    const selected = selectedCafe === c;
    const isCustom = c === "Custom Cafe";
    const scale = getScale("cafe", c);

    if (isCustom) {
      if (customCafeMode) {
        return (
          <View key="custom-cafe-input" style={{ marginBottom: 7 }}>
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
            />
            <TouchableOpacity
              onPress={() => {
                setCustomCafeMode(false);
                setCustomCafeText("");
              }}
              activeOpacity={0.8}
              style={{ marginTop: 7 }}
            >
              <Text style={styles.chooseFromList}>
                Choose from list instead
              </Text>
            </TouchableOpacity>
          </View>
        );
      }

      return (
        <AnimatedTouchable
          key={c}
          onPress={() => {
            setCustomCafeText("");
            setCustomCafeMode(true);
            setSelectedCafe(null);
            pressIn(scale);
            pressOutTo(scale, 1);
          }}
          onPressIn={() => pressIn(scale)}
          onPressOut={() => pressOutTo(scale, 1)}
          activeOpacity={0.85}
          style={[styles.pillAdd, { margin: 5, transform: [{ scale }] } as any]}
        >
          <Text style={styles.pillAddText}>Custom Cafe</Text>
        </AnimatedTouchable>
      );
    }

    if (selected) {
      return (
        <AnimatedTouchable
          key={c}
          onPress={() => selectCafe(c)}
          onPressIn={() => pressIn(scale)}
          onPressOut={() => pressOutTo(scale, 1.03)}
          activeOpacity={0.85}
          style={{ margin: 5, transform: [{ scale }] } as any}
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
        </AnimatedTouchable>
      );
    }

    return (
      <AnimatedTouchable
        key={c}
        onPress={() => selectCafe(c)}
        onPressIn={() => pressIn(scale)}
        onPressOut={() => pressOutTo(scale, 1)}
        activeOpacity={0.85}
        style={[
          styles.pillUnselectedCoffee,
          { margin: 5, transform: [{ scale }] } as any,
        ]}
      >
        <Text style={styles.pillUnselectedCoffeeText}>{c}</Text>
      </AnimatedTouchable>
    );
  };

  const renderCoffeeTypePill = (t: string) => {
    const selected = selectedType === t;
    const scale = getScale("type", t);

    if (selected) {
      return (
        <AnimatedTouchable
          key={t}
          onPress={() => selectType(t)}
          onPressIn={() => pressIn(scale)}
          onPressOut={() => pressOutTo(scale, 1.03)}
          activeOpacity={0.85}
          style={{ margin: 5, transform: [{ scale }] } as any}
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
        </AnimatedTouchable>
      );
    }

    return (
      <AnimatedTouchable
        key={t}
        onPress={() => selectType(t)}
        onPressIn={() => pressIn(scale)}
        onPressOut={() => pressOutTo(scale, 1)}
        activeOpacity={0.85}
        style={[
          styles.pillUnselectedCoffee,
          { margin: 5, transform: [{ scale }] } as any,
        ]}
      >
        <Text style={styles.pillUnselectedCoffeeText}>{t}</Text>
      </AnimatedTouchable>
    );
  };

  const renderCoffeeTypeCustomInput = () => {
    const scale = getScale("type", "__custom");
    if (customTypeMode) {
      return (
        <View key="__custom_type_input" style={{ marginBottom: 7 }}>
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
          />
          <TouchableOpacity
            onPress={() => {
              setCustomTypeMode(false);
              setCustomTypeText("");
            }}
            activeOpacity={0.8}
            style={{ marginTop: 7 }}
          >
            <Text style={styles.chooseFromList}>Choose from list instead</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <AnimatedTouchable
        key="__custom_type_plus"
        style={[styles.pillAdd, { margin: 5, transform: [{ scale }] } as any]}
        onPress={() => {
          setCustomTypeText("");
          setCustomTypeMode(true);
          setSelectedType(null);
          pressIn(scale);
          pressOutTo(scale, 1);
        }}
        onPressIn={() => pressIn(scale)}
        onPressOut={() => pressOutTo(scale, 1)}
        activeOpacity={0.85}
      >
        <Text style={styles.pillAddText}>+</Text>
      </AnimatedTouchable>
    );
  };

  const renderTastePill = (t: string) => {
    const selected = selectedTaste.includes(t);
    const scale = getScale("taste", t);

    if (selected) {
      return (
        <AnimatedTouchable
          key={t}
          onPress={() => toggleTaste(t)}
          onPressIn={() => pressIn(scale)}
          onPressOut={() => pressOutTo(scale, 1.03)}
          activeOpacity={0.85}
          style={{ margin: 5, transform: [{ scale }] } as any}
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
        </AnimatedTouchable>
      );
    }

    return (
      <AnimatedTouchable
        key={t}
        onPress={() => toggleTaste(t)}
        onPressIn={() => pressIn(scale)}
        onPressOut={() => pressOutTo(scale, 1)}
        activeOpacity={0.85}
        style={[
          styles.pillUnselectedCoffee,
          { margin: 5, transform: [{ scale }] } as any,
        ]}
      >
        <Text style={styles.pillUnselectedCoffeeText}>{t}</Text>
      </AnimatedTouchable>
    );
  };

  const stars = useMemo(() => [1, 2, 3, 4, 5], []);

  // Determine whether submit should be enabled.
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

    if (customCafeMode && customCafeText.trim()) {
      setSelectedCafe(customCafeText.trim());
    }
    if (customTypeMode && customTypeText.trim()) {
      setSelectedType(customTypeText.trim());
    }

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
            intensity={30}
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
              {/* plain X icon no background (size reduced by 1) */}
              <X size={17} color={colors.gradientStart} strokeWidth={3} />
            </TouchableOpacity>
          </View>

          <View style={styles.sheetDivider} />

          <ScrollView
            contentContainerStyle={styles.sheetBody}
            keyboardShouldPersistTaps="handled"
          >
            {/* Cafes / Custom input */}
            <View style={{ marginBottom: customCafeMode ? 6 : 0 }}>
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

            {/* Taste Profile (Optional) */}
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
              Taste Profile (Optional)
            </Text>
            <View style={styles.pillRow}>
              {TASTE_PROFILE.map((t) => renderTastePill(t))}
            </View>

            {/* Rating */}
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Rating</Text>
            <View style={styles.starsRow}>
              {stars.map((s) => {
                const scale = getScale("star", String(s));
                return (
                  <AnimatedTouchable
                    key={s}
                    onPress={() => {
                      const nextRating = rating === s ? 0 : s;
                      setRating(nextRating);
                    }}
                    onPressIn={() => pressIn(scale)}
                    onPressOut={() => pressOutTo(scale, rating >= s ? 1.12 : 1)}
                    style={[
                      styles.starButton,
                      { transform: [{ scale }] } as any,
                    ]}
                    activeOpacity={0.8}
                  >
                    {rating >= s ? (
                      <Star
                        size={25}
                        color={colors.gradientStart}
                        fill={colors.gradientStart}
                        strokeWidth={0}
                      />
                    ) : (
                      <Star size={25} color={"#DDD"} strokeWidth={1.6} />
                    )}
                  </AnimatedTouchable>
                );
              })}
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

  // Reduced paddingHorizontal by 1 and paddingVertical by 1 (was 14/8 -> now 13/7)
  pillSelected: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  pillSelectedText: { color: "#fff", fontWeight: "600" },

  pillUnselected: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.pillUnselectedBg,
    alignItems: "center",
    justifyContent: "center",
    margin: 5,
  },
  pillUnselectedText: { color: "#4E342E", fontWeight: "600" },

  // Coffee-type / cafe unselected pill also reduced
  pillUnselectedCoffee: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.coffeeTypeUnselectedBg,
    alignItems: "center",
    justifyContent: "center",
    margin: 5,
    borderWidth: 1,
    borderColor: colors.coffeeTypeUnselectedBorder,
  },
  pillUnselectedCoffeeText: {
    color: colors.coffeeTypeUnselectedText,
    fontWeight: "600",
  },

  pillAdd: {
    paddingHorizontal: 13,
    paddingVertical: 7,
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
    fontSize: 13,
    fontWeight: "400",
  },

  /* Full-width input used for Custom Cafe / Custom Type */
  fieldLabel: { color: "#4E342E", fontWeight: "700", marginBottom: 8 },
  fullInput: {
    width: "100%",
    paddingHorizontal: 13,
    paddingVertical: Platform.OS === "ios" ? 13 : 9,
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
