import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";

import { FontSize, Radius, Shadows, Spacing, type ThemeColors } from "../theme";
import { useTheme, useThemedStyles } from "../theme/ThemeProvider";
import { Button } from "./ui";
import AppText from "./ui/AppText";

const DUROOD_TEXT =
  "اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَىٰ إِبْرَاهِيمَ وَعَلَىٰ آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ،\n\nاللَّهُمَّ بَارِكْ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَىٰ إِبْرَاهِيمَ وَعَلَىٰ آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ";

/**
 * Shown once per app launch, before the user starts using the app.
 */
export function ReciteDuroodModal() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [visible, setVisible] = useState(true);

  return (
    <Modal
      transparent
      visible={visible}
      animationType='fade'
      statusBarTranslucent
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, Shadows.card]}>
          <View style={styles.iconCircle}>
            <Ionicons name='moon' size={22} color={colors.primary} />
          </View>

          <AppText variant='h2' center>
            Please Recite Durood-e-Ibrahimi
          </AppText>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.arabicCard}>
              <Text style={styles.arabicText}>{DUROOD_TEXT}</Text>
            </View>
          </ScrollView>

          <Button
            title='Done'
            onPress={() => setVisible(false)}
            icon='checkmark'
          />
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.backdrop,
      alignItems: "center",
      justifyContent: "center",
      padding: Spacing.xxl,
    },
    card: {
      width: "100%",
      maxWidth: 420,
      maxHeight: "88%",
      backgroundColor: colors.surface,
      borderRadius: Radius.xl,
      padding: Spacing.xxl,
      alignItems: "stretch",
      gap: Spacing.lg,
    },
    iconCircle: {
      alignSelf: "center",
      width: 52,
      height: 52,
      borderRadius: Radius.pill,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    scroll: {
      flexShrink: 1,
    },
    scrollContent: {
      paddingBottom: Spacing.xs,
    },
    arabicCard: {
      backgroundColor: colors.primaryFaint,
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
    },
    arabicText: {
      fontSize: FontSize.lg + 2,
      lineHeight: FontSize.lg + 18,
      color: colors.textPrimary,
      textAlign: "right",
      writingDirection: "rtl",
    },
  });

export default ReciteDuroodModal;
