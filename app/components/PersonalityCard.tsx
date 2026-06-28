import { Coffee } from "lucide-react-native";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { ThemeColors, getNeu } from "./colors";
import { useThemeStyles, useTheme } from "./ThemeContext";

export type Personality = {
  name: string;
  description: string;
  tags: string[];
};

type Props = {
  personality: Personality;
};

const PersonalityCard: React.FC<Props> = ({ personality }) => {
  const { colors, isDark } = useTheme();
  const styles = useThemeStyles(getStyles);

  if (!personality || !personality.name) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.headerLabel}>Your Coffee Personality</Text>
      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <Coffee size={32} color={colors.iconActive} />
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{personality.name}</Text>
          <Text style={styles.desc}>{personality.description}</Text>
        </View>
      </View>
      {personality.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {personality.tags.map((tag) => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const getStyles = (colors: ThemeColors, isDark: boolean) => {
  const neu = getNeu(colors, isDark);
  return StyleSheet.create({
    card: {
      margin: 16,
      borderRadius: 20,
      backgroundColor: colors.surface,
      padding: 20,
      ...neu.raised,
    },
    headerLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.coffeeTypeUnselectedText,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginBottom: 12,
    },
    body: {
      flexDirection: "row",
      alignItems: "center",
    },
    iconCircle: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
      ...Platform.select({
        ios: {
          shadowColor: colors.shadowDark,
          shadowOffset: { width: 4, height: 4 },
          shadowOpacity: isDark ? 0.8 : 0.5,
          shadowRadius: 8,
        },
        android: { elevation: 3 },
      }),
    },
    infoContainer: {
      flex: 1,
    },
    name: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 4,
    },
    desc: {
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 18,
    },
    tagsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 16,
      gap: 8,
    },
    tagChip: {
      backgroundColor: colors.surfacePressed,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    tagText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: "600",
    },
  });
};

export default PersonalityCard;
