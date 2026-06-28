import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { Clock, Globe, MapPin, Navigation, Phone, Star, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View
, TouchableOpacity} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeColors } from "./colors";
import { useThemeStyles, useTheme } from "./ThemeContext";
import { PlaceDetails, SimplePlace } from "../utils/places";
import HapticTouchable from "./_HapticTouchable";

export type PlaceUI = SimplePlace & {
  id: string;
  distanceKm: number;
  lat: number;
  lng: number;
  rating?: number;
  totalRatings?: number;
  openNow?: boolean;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  selectedCafe: PlaceUI | null;
  selectedCafeDetails: PlaceDetails | null;
  detailsLoading: boolean;
  onExited?: () => void;
};

export default function CafeDetailsSheet({
  visible,
  onClose,
  selectedCafe,
  selectedCafeDetails,
  detailsLoading,
  onExited,
}: Props) {
  const { colors, isDark } = useTheme();
  const styles = useThemeStyles(getStyles);
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(false);

  const [sheetHeight, setSheetHeight] = useState(0);
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(800)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      const start = sheetHeight > 0 ? sheetHeight : 800;
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
      const to = sheetHeight > 0 ? sheetHeight : 800;
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

  if (!mounted || !selectedCafe) return null;

  const backdropStyle = { opacity: backdropAnim };
  const tintOpacity = backdropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.22],
  });

  return (
    <Modal visible={mounted} animationType="none" transparent onRequestClose={onClose}>
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "rgba(0,0,0,0.3)", opacity: tintOpacity },
            ]}
          />
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        </Animated.View>

        <Animated.View
          onLayout={onSheetLayout}
          style={[
            styles.sheet,
            {
              transform: [{ translateY: sheetAnim }],
            },
          ]}
        >
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Cafe Details</Text>
            <HapticTouchable style={styles.closeButton} onPress={onClose} activeOpacity={0.8}>
              <X size={20} color="#795548" strokeWidth={2.5} />
            </HapticTouchable>
          </View>
          <View style={styles.sheetDivider} />

          <ScrollView contentContainerStyle={[styles.sheetBody, { paddingBottom: (insets.bottom || 12) + 24 }]} showsVerticalScrollIndicator={false}>
            {selectedCafe.photoUrl ? (
              <Image
                source={{ uri: selectedCafe.photoUrl }}
                style={styles.modalHeroImage}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.modalHeroImage, { alignItems: "center", justifyContent: "center", backgroundColor: colors.gradientStart }]}>
                <MapPin size={48} color="#FFF" />
              </View>
            )}

            <View style={styles.modalBodyContent}>
              <View style={styles.modalHeaderRowContent}>
                <Text style={styles.modalTitle}>{selectedCafe.name}</Text>
                {selectedCafe.rating ? (
                  <View style={styles.modalRatingBadge}>
                    <Star size={14} color="#FFF" fill="#FFF" />
                    <Text style={styles.modalRatingText}>{selectedCafe.rating}</Text>
                  </View>
                ) : null}
              </View>

              {selectedCafe.address ? (
                <View style={styles.modalAddressRow}>
                  <MapPin size={16} color={colors.textMuted} style={{ marginTop: 2 }} />
                  <Text style={styles.modalAddress}>{selectedCafe.address}</Text>
                </View>
              ) : null}

              <View style={styles.modalStatsRow}>
                {selectedCafe.openNow !== undefined && (
                  <View style={[styles.modalStatPill, { backgroundColor: selectedCafe.openNow ? "#E8F5E9" : "#FFEBEE" }]}>
                    <Text style={[styles.modalStatText, { color: selectedCafe.openNow ? "#2E7D32" : "#C62828" }]}>
                      {selectedCafe.openNow ? "Open Now" : "Closed"}
                    </Text>
                  </View>
                )}
                {selectedCafe.totalRatings ? (
                  <View style={styles.modalStatPill}>
                    <Text style={styles.modalStatText}>
                      {selectedCafe.totalRatings} Reviews
                    </Text>
                  </View>
                ) : null}
                {selectedCafe.distanceKm ? (
                  <View style={styles.modalStatPill}>
                    <Text style={styles.modalStatText}>
                      {selectedCafe.distanceKm < 1
                        ? `${Math.round(selectedCafe.distanceKm * 1000)}m away`
                        : `${selectedCafe.distanceKm.toFixed(1)}km away`}
                    </Text>
                  </View>
                ) : null}
                {selectedCafeDetails?.priceLevel !== undefined && (
                  <View style={styles.modalStatPill}>
                    <Text style={[styles.modalStatText, { color: colors.gradientStart }]}>
                      {Array(selectedCafeDetails.priceLevel).fill("$").join("")}
                    </Text>
                  </View>
                )}
              </View>

              {detailsLoading ? (
                <View style={{ alignItems: "center", paddingVertical: 20 }}>
                  <ActivityIndicator size="small" color={colors.gradientStart} />
                </View>
              ) : (
                <View style={styles.modalDetailsSection}>
                  {selectedCafeDetails?.editorialSummary ? (
                    <Text style={styles.modalSummaryText}>
                      {selectedCafeDetails.editorialSummary}
                    </Text>
                  ) : null}

                  {selectedCafeDetails?.phoneNumber ? (
                    <HapticTouchable
                      style={styles.modalDetailRow}
                      onPress={() => Linking.openURL(`tel:${selectedCafeDetails.phoneNumber}`)}
                    >
                      <View style={styles.modalDetailIcon}>
                        <Phone size={18} color={colors.accent} />
                      </View>
                      <Text style={styles.modalDetailText}>{selectedCafeDetails.phoneNumber}</Text>
                    </HapticTouchable>
                  ) : null}

                  {selectedCafeDetails?.website ? (
                    <HapticTouchable
                      style={styles.modalDetailRow}
                      onPress={() => Linking.openURL(selectedCafeDetails.website!)}
                    >
                      <View style={styles.modalDetailIcon}>
                        <Globe size={18} color={colors.accent} />
                      </View>
                      <Text style={styles.modalDetailText} numberOfLines={1}>
                        {selectedCafeDetails.website.replace(/^https?:\/\//, "")}
                      </Text>
                    </HapticTouchable>
                  ) : null}

                  {selectedCafeDetails?.weekdayText && selectedCafeDetails.weekdayText.length > 0 ? (
                    <View style={styles.modalDetailRow}>
                      <View style={styles.modalDetailIcon}>
                        <Clock size={18} color={colors.accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.modalDetailText, { marginBottom: 4 }]}>Opening Hours</Text>
                        {selectedCafeDetails.weekdayText.map((day, idx) => (
                          <Text key={idx} style={styles.modalScheduleText}>
                            {day}
                          </Text>
                        ))}
                      </View>
                    </View>
                  ) : null}
                </View>
              )}

              <HapticTouchable
                style={styles.modalDirectionsBtn}
                activeOpacity={0.8}
                onPress={() => {
                  if (selectedCafe) {
                    const url = Platform.select({
                      ios: `maps:0,0?q=${selectedCafe.name}@${selectedCafe.lat},${selectedCafe.lng}`,
                      android: `geo:0,0?q=${selectedCafe.lat},${selectedCafe.lng}(${selectedCafe.name})`,
                    });
                    if (url) Linking.openURL(url);
                  }
                }}
              >
                <Navigation size={18} color="#FFF" />
                <Text style={styles.modalDirectionsText}>Get Directions</Text>
              </HapticTouchable>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const getStyles = (colors: ThemeColors, isDark?: boolean) => StyleSheet.create({
  container: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, zIndex: 5 },
  sheet: {
    backgroundColor: colors.navbarBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: "hidden",
    maxHeight: "85%",
    paddingTop: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.navbarBorder,
    zIndex: 10,
    ...Platform.select({
      android: { elevation: 6 },
      ios: {
        shadowColor: isDark ? "#000" : colors.shadowDark,
        shadowOpacity: isDark ? 0.8 : 0.08,
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
  headerTitle: { fontSize: 16, color: "#795548", fontWeight: "700" },
  closeButton: { padding: 6 },
  sheetDivider: { height: 1, backgroundColor: colors.navbarBorder, marginBottom: 12 },

  sheetBody: {},

  modalHeroImage: {
    width: "100%",
    height: 220,
    backgroundColor: "#E4DED7",
    borderRadius: 12,
    marginBottom: 16,
  },
  modalBodyContent: {
    paddingHorizontal: 8,
    backgroundColor: colors.navbarBg,
  },
  modalHeaderRowContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  modalTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: "800",
    color: colors.textPrimary,
    marginRight: 16,
    letterSpacing: -0.5,
  },
  modalRatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.star,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modalRatingText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 4,
  },
  modalAddressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingRight: 20,
  },
  modalAddress: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
    marginLeft: 8,
  },
  modalStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  modalStatPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surfacePressed,
    borderRadius: 16,
  },
  modalStatText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  modalDetailsSection: {
    marginBottom: 24,
  },
  modalSummaryText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 22,
    fontStyle: "italic",
    marginBottom: 16,
    backgroundColor: colors.coffeeTypeUnselectedBg,
    padding: 12,
    borderRadius: 12,
  },
  modalDetailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalDetailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfacePressed,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  modalDetailText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "500",
    marginTop: 8,
  },
  modalScheduleText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
  },
  modalDirectionsBtn: {
    backgroundColor: colors.gradientStart,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: colors.gradientStart,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  modalDirectionsText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
});
