import { LinearGradient } from "expo-linear-gradient";
import { Coffee, Sparkles, Star } from "lucide-react-native";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemeColors, getNeu } from "./colors";
import { useThemeStyles, useTheme } from "./ThemeContext";

export type PalateRecommendation = {
  id: string;
  name: string;
  description: string;
  reason: string;
  tags: string[];
  match_score: number;
};

type Props = {
  item: PalateRecommendation;
  onPress?: () => void;
};

const ForYouCard: React.FC<Props> = ({ item, onPress }) => {
  const { colors, isDark } = useTheme();
  const styles = useThemeStyles(getStyles);

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
    >
      {/* Left circular gradient avatar */}
      <LinearGradient
        colors={[colors.tasteSelectedGradientStart, colors.tasteSelectedGradientEnd]}
        start={[0, 0]}
        end={[1, 1]}
        style={styles.avatar}
      >
        <Sparkles size={18} color="#fff" />
      </LinearGradient>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {item.name}
        </Text>
        
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
        
        <Text style={styles.reason} numberOfLines={2}>
          <Text style={{fontWeight: 'bold', color: colors.accentLight}}>Why: </Text>
          {item.reason}
        </Text>

        <View style={styles.badgeRow}>
          {typeof item.match_score === "number" && (
            <View style={styles.matchChip}>
              <Star size={10} color={colors.accent} fill={colors.accent} strokeWidth={0} />
              <Text style={styles.matchText}>{Math.round(item.match_score)}% match</Text>
            </View>
          )}
          {item.tags?.slice(0, 2).map((tag, idx) => (
            <View key={idx} style={styles.categoryChip}>
              <Text style={styles.categoryText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const getStyles = (colors: ThemeColors, isDark: boolean) => {
  const neu = getNeu(colors, isDark);
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "flex-start",
      ...neu.raised,
      backgroundColor: colors.surface,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      marginTop: 2,
      ...neu.pressed,
    },
    body: {
      flex: 1,
      justifyContent: "center",
    },
    title: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 4,
      letterSpacing: -0.2,
    },
    description: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 6,
      lineHeight: 16,
    },
    reason: {
      fontSize: 11,
      color: colors.textMuted,
      marginBottom: 8,
      fontStyle: 'italic',
      lineHeight: 15,
    },
    badgeRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 6,
    },
    matchChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.surfacePressed,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    matchText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.accent,
    },
    categoryChip: {
      backgroundColor: colors.surfacePressed,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    categoryText: {
      fontSize: 10,
      color: colors.textPrimary,
      fontWeight: "600",
    },
  });
};

export default React.memo(ForYouCard);
