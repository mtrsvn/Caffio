import { Coffee, MapPin, Star } from "lucide-react-native";
import React from "react";
import {
    Image,
    Platform,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import colors from "./colors";

export type MenuItem = {
  item_id: string;
  name: string;
  description?: string;
  image_url?: string;
  category?: string;
};

type Props = {
  item: MenuItem;
  shopName: string;
  onPress?: () => void;
};

export default function ForYouCard({ item, shopName, onPress }: Props) {
  const NAVBAR_BG = colors.navbarBg;
  const BORDER = colors.navbarBorder;
  const NAVBAR_TEXT = colors.gradientEnd;
  const MUTED = colors.iconInactive;

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={onPress}
      style={styles.wrapper}
      accessibilityRole="button"
    >
      <View
        style={[
          styles.card,
          { backgroundColor: NAVBAR_BG, borderColor: BORDER },
        ]}
      >
        {/* left image */}
        <View style={styles.imageContainer}>
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.imagePlaceholder,
                { backgroundColor: colors.gradientStart },
              ]}
            >
              <Coffee size={36} color="#fff" fill="none" strokeWidth={2} />
            </View>
          )}
        </View>

        {/* body */}
        <View style={styles.body}>
          <Text
            style={[styles.title, { color: NAVBAR_TEXT }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>

          <View style={styles.row}>
            <MapPin
              size={14}
              color={colors.gradientStart}
              fill={colors.gradientStart}
              strokeWidth={0}
              style={{ marginRight: 2 }}
            />
            <Text style={[styles.rowText, { color: MUTED }]} numberOfLines={1}>
              {shopName}
            </Text>
          </View>

          <View style={styles.row}>
            <Star
              size={13}
              color={colors.gradientStart}
              fill={colors.gradientStart}
              strokeWidth={0}
              style={{ marginRight: 2 }}
            />
            <Text style={[styles.rowText, { color: MUTED }]}>0% Match</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const IMAGE_SIZE = 80;

const styles = StyleSheet.create<{
  wrapper: ViewStyle;
  card: ViewStyle;
  imageContainer: ViewStyle;
  imagePlaceholder: ViewStyle;
  body: ViewStyle;
  title: TextStyle;
  row: ViewStyle;
  rowText: TextStyle;
}>({
  wrapper: {
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  card: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 0.6,
    flexDirection: "row",
    alignItems: "center",
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    margin: 12,
    borderRadius: 10,
    overflow: "hidden",
    flexShrink: 0,
  },
  imagePlaceholder: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.navbarBorder,
  },
  body: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 14,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  rowText: {
    marginLeft: 6,
    fontSize: 13,
    flex: 1,
  },
});
