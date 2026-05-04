import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Pressable, Modal, FlatList, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '../hooks/useProfile';
import { ACTIVITY_LABELS, ActivityLevel, Sex } from '../types/profile';

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
  "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon",
  "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
  "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo",
  "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania",
  "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius",
  "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia",
  "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman",
  "Pakistan", "Palau", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar",
  "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia",
  "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa",
  "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan",
  "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela",
  "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

const ITEM_HEIGHT = 44;

interface WheelPickerProps {
  data: number[];
  selectedValue: number;
  onValueChange: (value: number) => void;
  label?: string;
}

function WheelPicker({ data, selectedValue, onValueChange, label }: WheelPickerProps) {
  const flatListRef = useRef<FlatList>(null);
  const extendedData = useMemo(() => [0, 0, ...data, 0, 0], [data]);

  useEffect(() => {
    const index = data.indexOf(selectedValue);
    if (index !== -1) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: index * ITEM_HEIGHT, animated: false });
      }, 100);
    }
  }, []);

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    if (data[index] !== undefined) {
      onValueChange(data[index]);
    }
  };

  return (
    <View style={styles.wheelWrapper}>
      {label && <Text style={styles.wheelLabel}>{label}</Text>}
      <View style={styles.wheelContainer}>
        <View style={styles.selectionHighlight} />
        <FlatList
          ref={flatListRef}
          data={extendedData}
          keyExtractor={(_, i) => i.toString()}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={onMomentumScrollEnd}
          renderItem={({ item }) => {
            if (item === 0) return <View style={{ height: ITEM_HEIGHT }} />;
            const isSelected = item === selectedValue;
            return (
              <View style={styles.wheelItem}>
                <Text style={[styles.wheelItemText, isSelected && styles.wheelItemTextActive]}>{item}</Text>
              </View>
            );
          }}
          getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
        />
      </View>
    </View>
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useProfile();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [country, setCountry] = useState('');
  const [sex, setSex] = useState<Sex>('male');
  const [heightCm, setHeightCm] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderately_active');
  
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [tempDay, setTempDay] = useState(1);
  const [tempMonth, setTempMonth] = useState(1);
  const [tempYear, setTempYear] = useState(1990);

  const days = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), []);
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const years = useMemo(() => Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i), []);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setDob(profile.dateOfBirth);
      setCountry(profile.country);
      setSex(profile.sex);
      setHeightCm(profile.heightCm.toString());
      setActivityLevel(profile.activityLevel);

      const [y, m, d] = profile.dateOfBirth.split('-').map(Number);
      if (y && m && d) {
        setTempYear(y);
        setTempMonth(m);
        setTempDay(d);
      }
    }
  }, [profile]);

  const filteredCountries = useMemo(() => {
    return COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()));
  }, [countrySearch]);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) return;
    await updateProfile({
      firstName, lastName, dateOfBirth: dob, country, sex,
      heightCm: parseFloat(heightCm) || 175, activityLevel
    });
    router.back();
  };

  const confirmDate = () => {
    const formattedDate = `${tempYear}-${String(tempMonth).padStart(2, '0')}-${String(tempDay).padStart(2, '0')}`;
    setDob(formattedDate);
    setShowDatePicker(false);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Stack.Screen options={{
        title: 'Edit Profile',
        headerStyle: { backgroundColor: '#1e2126' },
        headerTintColor: '#ffffff',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Name */}
        <Text style={styles.sectionLabel}>NAME</Text>
        <View style={styles.inputCard}>
          <View style={styles.inputRow}>
            <View style={styles.inputWrapper}>
              <Text style={styles.fieldLabel}>First Name</Text>
              <TextInput style={styles.input} value={firstName} onChangeText={setFirstName}
                placeholder="First Name" placeholderTextColor="#4b5563" />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.fieldLabel}>Last Name</Text>
              <TextInput style={styles.input} value={lastName} onChangeText={setLastName}
                placeholder="Last Name" placeholderTextColor="#4b5563" />
            </View>
          </View>
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PERSONAL INFO</Text>
          <View style={styles.inputCard}>
            <Pressable style={styles.fieldRow} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.fieldLabel}>Date of Birth</Text>
              <View style={styles.fieldValueRow}>
                <Text style={[styles.fieldValue, !dob && styles.placeholder]}>{dob || 'Select Date'}</Text>
                <Ionicons name="calendar-outline" size={16} color="#8b5cf6" />
              </View>
            </Pressable>
            <View style={styles.fieldDivider} />
            <Pressable style={styles.fieldRow} onPress={() => setShowCountryPicker(true)}>
              <Text style={styles.fieldLabel}>Country</Text>
              <View style={styles.fieldValueRow}>
                <Text style={[styles.fieldValue, !country && styles.placeholder]} numberOfLines={1}>
                  {country || 'Select Country'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#8b5cf6" />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Sex */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SEX</Text>
          <View style={styles.segmentedControl}>
            <Pressable style={[styles.segment, sex === 'male' && styles.segmentActive]} onPress={() => setSex('male')}>
              <Ionicons name="male" size={18} color={sex === 'male' ? '#ffffff' : '#9ca3af'} />
              <Text style={[styles.segmentText, sex === 'male' && styles.segmentTextActive]}>Male</Text>
            </Pressable>
            <Pressable style={[styles.segment, sex === 'female' && styles.segmentActive]} onPress={() => setSex('female')}>
              <Ionicons name="female" size={18} color={sex === 'female' ? '#ffffff' : '#9ca3af'} />
              <Text style={[styles.segmentText, sex === 'female' && styles.segmentTextActive]}>Female</Text>
            </Pressable>
          </View>
        </View>

        {/* Body */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BODY DETAILS</Text>
          <View style={styles.inputCard}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Height (cm)</Text>
              <TextInput style={styles.fieldInput} value={heightCm} onChangeText={setHeightCm}
                keyboardType="numeric" placeholder="175" placeholderTextColor="#4b5563" />
            </View>
          </View>
        </View>

        {/* Activity Level */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACTIVITY LEVEL</Text>
          <Pressable style={styles.inputCard} onPress={() => setShowActivityPicker(true)}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Daily Activity</Text>
              <View style={styles.fieldValueRow}>
                <Text style={styles.fieldValue}>{ACTIVITY_LABELS[activityLevel]}</Text>
                <Ionicons name="chevron-forward" size={16} color="#8b5cf6" />
              </View>
            </View>
          </Pressable>
        </View>

        <TouchableOpacity 
          style={[styles.bottomSaveBtn, (!firstName.trim() || !lastName.trim()) && styles.bottomSaveBtnDisabled]}
          onPress={handleSave}
          disabled={!firstName.trim() || !lastName.trim()}
        >
          <Text style={styles.bottomSaveBtnText}>Save Changes</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Country Picker Modal */}
      <Modal visible={showCountryPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <Pressable onPress={() => setShowCountryPicker(false)}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </Pressable>
            </View>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#6b7280" />
              <TextInput style={styles.searchInput} placeholder="Search country..."
                placeholderTextColor="#6b7280" value={countrySearch}
                onChangeText={setCountrySearch} autoFocus />
            </View>
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable 
                  style={[styles.modalItem, country === item && styles.modalItemActive]}
                  onPress={() => { setCountry(item); setShowCountryPicker(false); setCountrySearch(''); }}
                >
                  <Text style={[styles.modalItemText, country === item && styles.modalItemTextActive]}>{item}</Text>
                  {country === item && <Ionicons name="checkmark" size={20} color="#8b5cf6" />}
                </Pressable>
              )}
              style={styles.modalList}
            />
          </View>
        </View>
      </Modal>

      {/* Activity Picker Modal */}
      <Modal visible={showActivityPicker} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowActivityPicker(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Activity Level</Text>
              <Pressable onPress={() => setShowActivityPicker(false)}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((level) => (
                <Pressable 
                  key={level} 
                  style={[styles.modalItem, activityLevel === level && styles.modalItemActive]}
                  onPress={() => { setActivityLevel(level); setShowActivityPicker(false); }}
                >
                  <Text style={[styles.modalItemText, activityLevel === level && styles.modalItemTextActive]}>
                    {ACTIVITY_LABELS[level]}
                  </Text>
                  {activityLevel === level && <Ionicons name="checkmark" size={20} color="#8b5cf6" />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Date Picker Modal (Wheel) */}
      <Modal visible={showDatePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: 420 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Birth Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.wheelsRow}>
              <WheelPicker data={days} selectedValue={tempDay} onValueChange={setTempDay} label="Day" />
              <WheelPicker data={months} selectedValue={tempMonth} onValueChange={setTempMonth} label="Month" />
              <WheelPicker data={years} selectedValue={tempYear} onValueChange={setTempYear} label="Year" />
            </View>
            <View style={{ padding: 24, paddingBottom: 40 }}>
              <TouchableOpacity onPress={confirmDate} style={styles.bottomSaveBtn}>
                <Text style={styles.bottomSaveBtnText}>Confirm Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
  },
  scrollContent: {
    padding: 20,
  },
  saveBtn: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: '700',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  // Section layout — matches edit-goal
  section: {
    marginTop: 24,
  },
  sectionLabel: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  // Input cards — matches edit-goal
  inputCard: {
    backgroundColor: '#1e2126',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2d35',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
  },
  fieldLabel: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    height: 24,
    padding: 0,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldValue: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  fieldInput: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    height: 24,
    padding: 0,
    minWidth: 60,
  },
  fieldDivider: {
    height: 1,
    backgroundColor: '#2a2d35',
    marginVertical: 14,
  },
  placeholder: {
    color: '#4b5563',
  },
  // Segmented control — matches edit-goal
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#1e2126',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  segmentActive: {
    backgroundColor: '#8b5cf6',
  },
  segmentText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#ffffff',
  },
  // Bottom save — matches edit-goal
  bottomSaveBtn: {
    backgroundColor: '#8b5cf6',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomSaveBtnDisabled: {
    backgroundColor: '#374151',
    shadowOpacity: 0,
    elevation: 0,
  },
  bottomSaveBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e2126',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  cancelText: {
    color: '#9ca3af',
    fontSize: 15,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25292e',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 48,
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
  },
  modalList: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  modalItemActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  modalItemText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '500',
  },
  modalItemTextActive: {
    color: '#8b5cf6',
    fontWeight: '700',
  },
  // Wheel Picker
  wheelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    flex: 1,
  },
  wheelWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  wheelLabel: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  wheelContainer: {
    height: ITEM_HEIGHT * 5,
    width: '100%',
    position: 'relative',
  },
  selectionHighlight: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelItemText: {
    color: '#4b5563',
    fontSize: 18,
    fontWeight: '500',
  },
  wheelItemTextActive: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
});
