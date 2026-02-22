import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Camera, Star } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Animated,
    Easing,
    LayoutChangeEvent,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
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
  const [selectedCafe, setSelectedCafe] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedTaste, setSelectedTaste] = useState<string[]>([]);
  const [rating, setRating] = useState<number>(0);

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
      ]).start();
    } else if (mounted) {
      // animate out then unmount
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
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, sheetHeight]);

  const toggleTaste = (t: string) => {
    setSelectedTaste((prev) =>
      prev.includes(t) ? prev.filter((p) => p !== t) : [...prev, t],
    );
  };

  const selectType = (t: string) => {
    setSelectedType((prev) => (prev === t ? null : t));
  };

  const selectCafe = (c: string) => {
    setSelectedCafe((prev) => (prev === c ? null : c));
  };

  const renderCafePill = (c: string) => {
    const selected = selectedCafe === c;
    const isCustom = c === "Custom Cafe";

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

    if (isCustom) {
      return (
        <TouchableOpacity
          key={c}
          onPress={() => selectCafe(c)}
          activeOpacity={0.85}
          style={[styles.pillAdd, { margin: 6 }]}
        >
          <Text style={styles.pillAddText}>Custom Cafe</Text>
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
        <Text style={[styles.pillUnselectedCoffeeText]}>{t}</Text>
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
            <Text style={[styles.pillSelectedText]}>{t}</Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    // Use coffee-type/cafe unselected style (as requested)
    return (
      <TouchableOpacity
        key={t}
        onPress={() => toggleTaste(t)}
        activeOpacity={0.85}
        style={[styles.pillUnselectedCoffee, { margin: 6 }]}
      >
        <Text style={[styles.pillUnselectedCoffeeText]}>{t}</Text>
      </TouchableOpacity>
    );
  };

  const stars = useMemo(() => [1, 2, 3, 4, 5], []);

  // onLayout capture sheet height for animation
  const onSheetLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h && h > 0 && h !== sheetHeight) {
      setSheetHeight(h);
    }
  };

  // If not mounted, don't render the modal at all
  if (!mounted) return null;

  // animated styles
  const backdropStyle = {
    opacity: backdropAnim,
  };

  // darker tint overlay (interpolated from backdropAnim)
  const tintOpacity = backdropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.22], // ~22% dark tint over blur for glassmorphism
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
          {/* BlurView intensity set high for strong blur */}
          <BlurView
            intensity={100}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />

          {/* semi-transparent dark tint on top of blur to achieve glassmorphism darkness */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "rgba(0,0,0,0.3)", opacity: tintOpacity },
            ]}
          />

          {/* transparent touch layer above the blur/tint to capture taps */}
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
          <View style={styles.sheetHandle} />

          <ScrollView
            contentContainerStyle={styles.sheetBody}
            keyboardShouldPersistTaps="handled"
          >
            {/* Cafe section */}
            <Text style={styles.sectionTitle}>Cafe</Text>
            <View style={styles.pillRow}>
              {CAFES.map((c) => renderCafePill(c))}
            </View>

            {/* Coffee Type */}
            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>
              Coffee Type
            </Text>
            <View style={styles.pillRow}>
              {COFFEE_TYPES.map((t) => renderCoffeeTypePill(t))}
              <TouchableOpacity
                style={[styles.pillAdd, { margin: 6 }]}
                onPress={() => {}}
              >
                <Text style={styles.pillAddText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Taste Profile (optional lang) */}
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
              Taste Profile (optional lang)
            </Text>
            <View style={styles.pillRow}>
              {TASTE_PROFILE.map((t) => renderTastePill(t))}
            </View>

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
              style={styles.actionButton}
              activeOpacity={0.9}
              onPress={onClose}
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
                  Save Log
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
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
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
  sheetHandle: {
    width: 42,
    height: 6,
    backgroundColor: "#E1D7D3",
    borderRadius: 4,
    alignSelf: "center",
    marginBottom: 8,
  },
  sheetBody: {
    paddingBottom: 24,
  },
  sectionTitle: {
    color: "#4E342E",
    fontWeight: "700",
    marginBottom: 8,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  pillSelected: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  pillSelectedText: {
    color: "#fff",
    fontWeight: "600",
  },
  pillUnselected: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.pillUnselectedBg,
    alignItems: "center",
    justifyContent: "center",
    margin: 6,
  },
  pillUnselectedText: {
    color: "#4E342E",
    fontWeight: "600",
  },
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

  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  starButton: {
    marginRight: 8,
  },
  star: {
    fontSize: 26,
  },
  starActive: {
    color: colors.gradientStart,
  },
  starInactive: {
    color: "#DDD",
  },

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
  photoInner: {
    alignItems: "center",
  },
  photoText: {
    color: colors.gradientStart,
    fontWeight: "600",
    marginTop: 8,
  },

  actionButton: {
    marginTop: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  actionButtonInner: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    fontWeight: "700",
    fontSize: 16,
  },
});
