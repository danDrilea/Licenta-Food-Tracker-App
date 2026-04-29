import React from 'react';
import { StyleSheet, View, ScrollView, Text } from 'react-native';
import { useSettings } from '../../contexts/SettingsContext';
import { SettingsGroup, SettingsRow, SettingsToggleRow } from '../../components/settings/SettingsRow';
import MealEditor from '../../components/settings/MealEditor';
import UnitSelector from '../../components/settings/UnitSelector';
import DailyGoalsEditor from '../../components/settings/DailyGoalsEditor';

export default function SettingsScreen() {
  const {
    settings,
    toggleTheme,
    setWeightUnit,
    setHeightUnit,
    setEnergyUnit,
    addMeal,
    removeMeal,
    renameMeal,
    updateMeals,
    updateDailyGoals,
    setNotificationsEnabled,
    setMealReminders,
  } = useSettings();

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ─── Appearance ─── */}
      <SettingsGroup title="Appearance">
        <SettingsToggleRow
          icon="moon-outline"
          iconColor="#facc15"
          label="Dark Mode"
          value={settings.theme === 'dark'}
          onToggle={toggleTheme}
          isLast
        />
      </SettingsGroup>

      {/* ─── Meals ─── */}
      <MealEditor
        meals={settings.meals}
        onUpdateMeals={updateMeals}
        onAddMeal={addMeal}
        onRemoveMeal={removeMeal}
        onRenameMeal={renameMeal}
      />

      {/* ─── Daily Goals ─── */}
      <DailyGoalsEditor
        goals={settings.dailyGoals}
        onSave={updateDailyGoals}
      />

      {/* ─── Units ─── */}
      <UnitSelector
        weightUnit={settings.weightUnit}
        heightUnit={settings.heightUnit}
        energyUnit={settings.energyUnit}
        onWeightChange={setWeightUnit}
        onHeightChange={setHeightUnit}
        onEnergyChange={setEnergyUnit}
      />

      {/* ─── Notifications ─── */}
      <SettingsGroup title="Notifications">
        <SettingsToggleRow
          icon="notifications-outline"
          iconColor="#38bdf8"
          label="Enable Notifications"
          value={settings.notificationsEnabled}
          onToggle={setNotificationsEnabled}
        />
        <SettingsToggleRow
          icon="alarm-outline"
          iconColor="#f59e0b"
          label="Meal Reminders"
          value={settings.mealReminders}
          onToggle={setMealReminders}
          isLast
        />
      </SettingsGroup>

      {/* ─── About ─── */}
      <SettingsGroup title="About">
        <SettingsRow
          icon="information-circle-outline"
          label="Version"
          value="1.0.0"
        />
        <SettingsRow
          icon="document-text-outline"
          label="Terms of Service"
          onPress={() => console.log('Open ToS')}
        />
        <SettingsRow
          icon="shield-checkmark-outline"
          label="Privacy Policy"
          onPress={() => console.log('Open Privacy Policy')}
          isLast
        />
      </SettingsGroup>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Food Tracker</Text>
        <Text style={styles.footerSub}>Made with 💜</Text>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#25292e',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 4,
  },
  footerText: {
    color: '#4b5563',
    fontSize: 13,
    fontWeight: '600',
  },
  footerSub: {
    color: '#4b5563',
    fontSize: 12,
  },
  bottomSpacer: {
    height: 30,
  },
});
