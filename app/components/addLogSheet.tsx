import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Camera, Star, X } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
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
import { addCoffeeLog } from "../../firebaseconfig";
import colors from "./colors";

type Props = {
  visible: boolean;
  onClose: () => void;
  
  uid: string;
  
  onSaved?: (entry: {
    id: string;
    coffeeType: string;
    cafe: string;
    rating: number;
    tasteProfile: string[];
    photoUri: string | null;
    createdAt: Date;
    uid: string;
  }) => void;
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

import TASTE_PROFILE from "../data/tastes.json";

export default function AddLogSheet({ visible, onClose, uid, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);

  
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  
  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access media library is required!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  
  const [selectedCafe, setSelectedCafe] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedTaste, setSelectedTaste] = useState<string[]>([]);
  const [rating, setRating] = useState<number>(0);

  
  const [customCafeMode, setCustomCafeMode] = useState(false);
  const [customCafeText, setCustomCafeText] = useState("");
  const customCafeRef = useRef<TextInput | null>(null);

  const [customTypeMode, setCustomTypeMode] = useState(false);
  const [customTypeText, setCustomTypeText] = useState("");
  const customTypeRef = useRef<TextInput | null>(null);

  
  const sheetAnim = useRef(new Animated.Value(0)).current; 
  const backdropAnim = useRef(new Animated.Value(0)).current; 
  const [sheetHeight, setSheetHeight] = useState(0);
  const [mounted, setMounted] = useState(false);

  
  const scalesRef = useRef<Record<string, Animated.Value>>({});

  
  const getScale = (category: string, name: string) => {
    const key = `${category}:${name}`;
    if (!scalesRef.current[key]) {
      scalesRef.current[key] = new Animated.Value(1);
    }
    return scalesRef.current[key];
  };

  
  const animateTo = (animated: Animated.Value, toValue: number) => {
    Animated.spring(animated, {
      toValue,
      useNativeDriver: true,
      friction: 8,
      tension: 120,
    }).start();
  };

  
  const pressIn = (animated: Animated.Value) => {
    Animated.timing(animated, {
      toValue: 0.94,
      duration: 80,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  
  const pressOutTo = (animated: Animated.Value, target = 1) => {
    Animated.spring(animated, {
      toValue: target,
      useNativeDriver: true,
      friction: 7,
      tension: 160,
    }).start();
  };

  
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
        
        setCustomCafeMode(false);
        setCustomTypeMode(false);
      });
    }
    
  }, [visible, sheetHeight]);

  
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
    const isSelected = selectedTaste.includes(t);
    const scale = getScale("taste", t);
    
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

  
  useEffect(() => {
    CAFES.forEach((c) => {
      const scale = getScale("cafe", c);
      const isSelected = selectedCafe === c;
      animateTo(scale, isSelected ? 1.03 : 1);
    });

    
    if (selectedCafe && !CAFES.includes(selectedCafe)) {
      const scale = getScale("cafe", selectedCafe);
      animateTo(scale, 1.03);
    }

    COFFEE_TYPES.forEach((t) => {
      const scale = getScale("type", t);
      const isSelected = selectedType === t;
      animateTo(scale, isSelected ? 1.03 : 1);
    });

    if (selectedType && !COFFEE_TYPES.includes(selectedType)) {
      const scale = getScale("type", selectedType);
      animateTo(scale, 1.03);
    }

    TASTE_PROFILE.forEach((tp) => {
      const scale = getScale("taste", tp);
      const isSelected = selectedTaste.includes(tp);
      animateTo(scale, isSelected ? 1.03 : 1);
    });
    
  }, [selectedCafe, selectedType, selectedTaste]);

  
  const onSheetLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h && h > 0 && h !== sheetHeight) setSheetHeight(h);
  };

  
  useEffect(() => {
    const stars = [1, 2, 3, 4, 5];
    stars.forEach((s) => {
      const scale = getScale("star", String(s));
      const isActive = rating >= s;
      
      animateTo(scale, isActive ? 1.12 : 1);
    });
  }, [rating]);

  
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  
  
  
  const renderCustomCafePill = () => {
    if (!selectedCafe || CAFES.includes(selectedCafe)) return null;
    const c = selectedCafe;
    const scale = getScale("cafe", c);
    return (
      <AnimatedTouchable
        key="__custom_cafe_selected"
        onPress={() => {
          
          setCustomCafeText(c);
          setCustomCafeMode(true);
          setSelectedCafe(null);
          pressIn(scale);
          pressOutTo(scale, 1);
        }}
        onPressIn={() => pressIn(scale)}
        onPressOut={() => pressOutTo(scale, 1)}
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
  };

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

  const renderCustomTypePill = () => {
    if (!selectedType || COFFEE_TYPES.includes(selectedType)) return null;
    const t = selectedType;
    const scale = getScale("type", t);
    return (
      <AnimatedTouchable
        key="__custom_type_selected"
        onPress={() => {
          
          setCustomTypeText(t);
          setCustomTypeMode(true);
          setSelectedType(null);
          pressIn(scale);
          pressOutTo(scale, 1);
        }}
        onPressIn={() => pressIn(scale)}
        onPressOut={() => pressOutTo(scale, 1)}
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

  
  const finalCafeValue =
    selectedCafe ??
    (customCafeMode && customCafeText.trim() ? customCafeText.trim() : null);
  const finalTypeValue =
    selectedType ??
    (customTypeMode && customTypeText.trim() ? customTypeText.trim() : null);
  const canSubmit = Boolean(
    finalCafeValue && finalTypeValue && rating > 0 && uid,
  );

  
  const handleSave = async () => {
    if (!uid) {
      alert("You must be logged in to save a coffee log.");
      return;
    }
    if (!canSubmit) return;

    
    if (customCafeMode && customCafeText.trim()) {
      setSelectedCafe(customCafeText.trim());
    }
    if (customTypeMode && customTypeText.trim()) {
      setSelectedType(customTypeText.trim());
    }

    
    const finalCafe =
      selectedCafe ??
      (customCafeMode && customCafeText.trim() ? customCafeText.trim() : null);
    const finalType =
      selectedType ??
      (customTypeMode && customTypeText.trim() ? customTypeText.trim() : null);

    if (!finalCafe || !finalType) {
      
      return;
    }

    setSaving(true);
    try {
      
      
      console.log("[addLogSheet] saving log for uid", uid);

      const docId = await addCoffeeLog(uid, {
        coffeeType: finalType,
        cafe: finalCafe,
        rating,
        tasteProfile: selectedTaste,
        photoLocalUri: photoUri ?? undefined,
      });

      
      const entry = {
        id: docId,
        coffeeType: finalType,
        cafe: finalCafe,
        rating,
        tasteProfile: selectedTaste,
        photoUri: photoUri ?? null,
        favorite: false,
        createdAt: new Date(),
        uid,
      };
      onSaved?.(entry);

      
      onClose();
      setCustomCafeMode(false);
      setCustomTypeMode(false);
    } catch (err: any) {
      
      console.error("[addLogSheet] failed to save log", err);
      alert(
        `Unable to save log: ${err?.code || ""} ${
          err?.message || err?.toString() || "unknown"
        }\n\n${JSON.stringify(err)}`,
      );
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
    <Modal
      visible={mounted}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {}
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

        {}
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
          {}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Add Coffee Purchase</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              activeOpacity={0.85}
            >
              {}
              <X size={17} color={colors.gradientStart} strokeWidth={3} />
            </TouchableOpacity>
          </View>

          <View style={styles.sheetDivider} />

          <ScrollView
            contentContainerStyle={styles.sheetBody}
            keyboardShouldPersistTaps="handled"
          >
            {}
            <View style={{ marginBottom: customCafeMode ? 6 : 0 }}>
              {!customCafeMode && (
                <Text style={[styles.sectionTitle, { marginTop: 12 }]}>
                  Cafe
                </Text>
              )}
              {!customCafeMode && (
                <View style={styles.pillRow}>
                  {renderCustomCafePill()}
                  {CAFES.map((c) => renderCafePill(c))}
                </View>
              )}
              {customCafeMode && renderCafePill("Custom Cafe")}
            </View>

            {}
            {!customTypeMode && (
              <Text style={[styles.sectionTitle, { marginTop: 12 }]}>
                Coffee Type
              </Text>
            )}
            {!customTypeMode && (
              <View style={styles.pillRow}>
                {renderCustomTypePill()}
                {COFFEE_TYPES.map((t) => renderCoffeeTypePill(t))}
                {renderCoffeeTypeCustomInput()}
              </View>
            )}
            {customTypeMode && renderCoffeeTypeCustomInput()}

            {}
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
              Taste Profile (Optional)
            </Text>
            <View style={styles.pillRow}>
              {TASTE_PROFILE.map((t) => renderTastePill(t))}
            </View>

            {}
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
            {}
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
              Photo (Optional)
            </Text>
            <View
              style={[
                styles.photoBox,
                {
                  padding: 0,
                  overflow: "hidden",
                  position: "relative",
                  height: 120,
                  borderRadius: 12,
                },
              ]}
            >
              {photoUri ? (
                <>
                  <Image
                    source={{ uri: photoUri }}
                    style={{
                      width: "100%",
                      height: "100%",
                      resizeMode: "cover",
                      borderRadius: 12,
                    }}
                  />
                  <TouchableOpacity
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      backgroundColor: "rgba(0,0,0,0.5)",
                      borderRadius: 16,
                      padding: 4,
                      zIndex: 2,
                    }}
                    onPress={() => setPhotoUri(null)}
                  >
                    <X size={20} color="#fff" />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.photoInner,
                    { height: 120, justifyContent: "center" },
                  ]}
                  activeOpacity={0.85}
                  onPress={handlePickPhoto}
                >
                  <Camera size={36} color={colors.gradientStart} />
                  <Text style={styles.photoText}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>
            {photoUri && (
              <TouchableOpacity
                style={{
                  marginTop: 10,
                  borderRadius: 16,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: colors.coffeeTypeUnselectedBorder,
                }}
                onPress={handlePickPhoto}
                activeOpacity={0.85}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 8,
                  }}
                >
                  <Camera
                    size={20}
                    color={colors.gradientStart}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={{
                      color: colors.gradientStart,
                      fontWeight: "700",
                      fontSize: 15,
                    }}
                  >
                    Change Photo
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {}
            <View style={{ height: 12 }} />
            <TouchableOpacity
              style={[
                styles.actionButton,
                (!canSubmit || saving) && styles.actionButtonDisabled,
              ]}
              activeOpacity={0.9}
              onPress={handleSave}
              disabled={!canSubmit || saving}
            >
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={[0, 0]}
                end={[1, 1]}
                style={styles.actionButtonInner}
              >
                {saving ? (
                  <ActivityIndicator color={colors.iconActive} />
                ) : (
                  <Text
                    style={[
                      styles.actionButtonText,
                      { color: colors.iconActive },
                    ]}
                  >
                    Add Coffee
                  </Text>
                )}
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
