import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList,
  TextInput,
  ScrollView,
  Image,
  I18nManager,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChange, logOut, getCurrentUser } from '../services/firebaseAuth';
import { isAdmin } from '../services/adminService';
import { isDoctor } from '../services/doctorService';

const translations = {
  fr: {
    welcome: 'Bonjour',
    subtitle: 'Comment pouvons-nous vous aider aujourd\'hui ?',
    popular: 'Recherches populaires',
    specialties: 'Spécialités',
    searchPlaceholder: 'Rechercher un médecin...'
  },
  en: {
    welcome: 'Hello',
    subtitle: 'How can we help you today?',
    popular: 'Popular searches',
    specialties: 'Specialties',
    searchPlaceholder: 'Search for a doctor...'
  },
  ar: {
    welcome: 'مرحبا',
    subtitle: 'كيف يمكننا مساعدتك اليوم؟',
    popular: 'عمليات البحث الشائعة',
    specialties: 'التخصصات',
    searchPlaceholder: 'ابحث عن طبيب...'
  }
};

const languageOptions = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
  { code: 'ar', label: 'AR' },
];

const doctorTypes = [
  { id: '1', name: 'Généraliste', icon: 'medkit', color: '#E3F2FD' },
  { id: '2', name: 'Dentiste', icon: 'happy', color: '#E8F5E9' },
  { id: '3', name: 'Cardiologue', icon: 'heart', color: '#FFEBEE' },
  { id: '4', name: 'Pédiatre', icon: 'people', color: '#FFF3E0' },
  { id: '5', name: 'Psychiatre', icon: 'person', color: '#F3E5F5' },
  { id: '6', name: 'Ophtalmologue', icon: 'eye', color: '#E0F7FA' },
];

const popularSearches = [
  'Dentiste',
  'Généraliste',
  'Pédiatre',
  'Ophtalmologue',
];

export default function HomeScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState('fr');
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  const t = translations[language];

  useEffect(() => {
    // Listen to authentication state changes
    const unsubscribe = onAuthStateChange(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsGuest(false);
        
        // Check if user is a doctor first - redirect if so
        const doctorStatus = await isDoctor();
        if (doctorStatus) {
          // Redirect to doctor dashboard
          navigation.replace('DoctorDashboard');
          return;
        }
        
        // Check if user is admin
        const adminStatus = await isAdmin();
        setUserIsAdmin(adminStatus);
      } else {
        setUser(null);
        setUserIsAdmin(false);
        // Check if guest mode was set
        const guestMode = await AsyncStorage.getItem('guest_mode');
        if (guestMode === 'true') {
          setIsGuest(true);
          setUser({ name: 'Invité', isGuest: true });
        } else {
          setIsGuest(false);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            const result = await logOut();
            if (result.success || isGuest) {
              // Clear guest mode if set
              await AsyncStorage.removeItem('guest_mode');
              navigation.replace('Auth');
            } else {
              Alert.alert('Erreur', result.error || 'Impossible de se déconnecter');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: item.color }]}
      onPress={() => navigation.navigate('DoctorList', { specialty: item.name })}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Ionicons name={item.icon} size={32} color="#00897B" />
        </View>
        <Text style={styles.label}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate('DoctorList', { specialty: searchQuery });
    }
  };

  // Optional: Change layout direction for Arabic
  React.useEffect(() => {
    if (language === 'ar') {
      I18nManager.forceRTL(true);
    } else {
      I18nManager.forceRTL(false);
    }
  }, [language]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.languagePicker}>
          {languageOptions.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.langButton, language === lang.code && styles.langButtonActive]}
              onPress={() => setLanguage(lang.code)}
            >
              <Text style={[styles.langButtonText, language === lang.code && styles.langButtonTextActive]}>{lang.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeHeader}>
            <View style={styles.welcomeTextContainer}>
              <Text style={styles.welcomeText}>
                {t.welcome} {user?.name || user?.displayName || user?.email?.split('@')[0] || 'Invité'} 👋
              </Text>
              {isGuest && (
                <Text style={styles.guestBadge}>Mode Invité</Text>
              )}
              {userIsAdmin && !isGuest && (
                <Text style={styles.adminBadge}>Administrateur</Text>
              )}
            </View>
            <View style={styles.headerActions}>
              {userIsAdmin && !isGuest && (
                <TouchableOpacity 
                  style={styles.adminButton}
                  onPress={() => navigation.navigate('AdminDashboard')}
                >
                  <Ionicons name="shield-checkmark" size={24} color="#00897B" />
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={24} color="#00897B" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.subtitle}>{t.subtitle}</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.popular}</Text>
        <View style={styles.popularSearches}>
          {popularSearches.map((search, index) => (
            <TouchableOpacity
              key={index}
              style={styles.searchTag}
              onPress={() => navigation.navigate('DoctorList', { specialty: search })}
            >
              <Ionicons name="trending-up" size={16} color="#00897B" style={styles.tagIcon} />
              <Text style={styles.searchTagText}>{search}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.specialties}</Text>
        <FlatList
          data={doctorTypes}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          scrollEnabled={false}
        />
      </View>

      {!isGuest && user && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.messagesButton}
            onPress={() => navigation.navigate('UserAppointments')}
          >
            <View style={styles.messagesButtonContent}>
              <View style={styles.messagesIconContainer}>
                <Ionicons name="chatbubbles" size={28} color="#fff" />
              </View>
              <View style={styles.messagesTextContainer}>
                <Text style={styles.messagesTitle}>Mes Messages</Text>
                <Text style={styles.messagesSubtitle}>Voir mes conversations avec les médecins</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#00897B" />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#E0F2F1',
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  languagePicker: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  langButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#00897B',
  },
  langButtonActive: {
    backgroundColor: '#00897B',
  },
  langButtonText: {
    color: '#00897B',
    fontWeight: 'bold',
  },
  langButtonTextActive: {
    color: '#fff',
  },
  welcomeSection: {
    paddingHorizontal: 20,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00897B',
    marginBottom: 5,
  },
  guestBadge: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: -5,
  },
  adminBadge: {
    fontSize: 12,
    color: '#00897B',
    fontWeight: '600',
    marginTop: -5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  adminButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 15,
    marginTop: -20,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingHorizontal: 15,
    marginRight: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#00897B',
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  popularSearches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  searchTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2F1',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  tagIcon: {
    marginRight: 5,
  },
  searchTagText: {
    color: '#00897B',
    fontSize: 14,
    fontWeight: '500',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  card: {
    borderRadius: 20,
    width: '48%',
    aspectRatio: 1,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  messagesButton: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  messagesButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messagesIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00897B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  messagesTextContainer: {
    flex: 1,
  },
  messagesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  messagesSubtitle: {
    fontSize: 14,
    color: '#666',
  },
});
