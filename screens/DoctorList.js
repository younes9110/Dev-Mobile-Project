import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllDoctors } from '../services/adminService';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

const filters = [
  { id: 'rating', label: 'Meilleure note', icon: 'star' },
  { id: 'distance', label: 'Plus proche', icon: 'location' },
  { id: 'price', label: 'Prix', icon: 'cash' },
  { id: 'availability', label: 'Disponibilité', icon: 'calendar' },
];

export default function DoctorList({ route, navigation }) {
  const { specialty } = route.params;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('rating');
  const [scrollY] = useState(new Animated.Value(0));
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [200, 100],
    extrapolate: 'clamp',
  });

  // Fetch doctors from Firebase
  useEffect(() => {
    const unsubscribe = getAllDoctors((doctorsList) => {
      // Filter by specialty
      const specialtyDoctors = doctorsList.filter(
        (doctor) => doctor.specialty === specialty
      );
      setDoctors(specialtyDoctors);
      setFilteredDoctors(specialtyDoctors);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [specialty]);

  // Get user location for distance calculation
  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setUserLocation(location.coords);
        }
      } catch (error) {
        console.error('Error getting location:', error);
      }
    };
    getLocation();
  }, []);

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance.toFixed(1);
  };

  // Filter and sort doctors
  useEffect(() => {
    let filtered = [...doctors];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (doctor) =>
          doctor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doctor.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Calculate distances if user location is available
    if (userLocation) {
      filtered = filtered.map((doctor) => {
        if (doctor.latitude && doctor.longitude) {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            doctor.latitude,
            doctor.longitude
          );
          return { ...doctor, calculatedDistance: distance };
        }
        return doctor;
      });
    }

    // Apply sorting based on selected filter
    filtered.sort((a, b) => {
      switch (selectedFilter) {
        case 'rating':
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          return ratingB - ratingA;
        case 'distance':
          if (!userLocation) return 0;
          const distA = a.calculatedDistance || Infinity;
          const distB = b.calculatedDistance || Infinity;
          return distA - distB;
        case 'price':
          const priceA = parseFloat(a.price?.replace(/[^0-9.]/g, '')) || 0;
          const priceB = parseFloat(b.price?.replace(/[^0-9.]/g, '')) || 0;
          return priceA - priceB;
        default:
          return 0;
      }
    });

    setFilteredDoctors(filtered);
  }, [doctors, searchQuery, selectedFilter, userLocation]);

  const renderDoctorCard = ({ item }) => {
    const distanceText = item.calculatedDistance
      ? `${item.calculatedDistance} km`
      : item.city || 'Localisation non disponible';
    
    const rating = item.rating || 0;
    const reviews = item.reviews || 0;

    return (
      <TouchableOpacity
        style={styles.doctorCard}
        onPress={() => navigation.navigate('DoctorProfile', { doctor: item })}
      >
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.doctorImage} />
        ) : (
          <View style={[styles.doctorImage, styles.doctorImagePlaceholder]}>
            <Ionicons name="person" size={40} color="#ccc" />
          </View>
        )}
        <View style={styles.doctorInfo}>
          <View style={styles.doctorHeader}>
            <Text style={styles.doctorName}>{item.name || 'Médecin'}</Text>
            {(rating > 0 || reviews > 0) && (
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.rating}>{rating.toFixed(1)}</Text>
                {reviews > 0 && <Text style={styles.reviews}>({reviews})</Text>}
              </View>
            )}
          </View>
          
          <Text style={styles.specialty}>{item.specialty}</Text>
          
          <View style={styles.detailsContainer}>
            {item.experience && (
              <View style={styles.detailItem}>
                <Ionicons name="time" size={16} color="#666" />
                <Text style={styles.detailText}>{item.experience}</Text>
              </View>
            )}
            <View style={styles.detailItem}>
              <Ionicons name="location" size={16} color="#666" />
              <Text style={styles.detailText}>{distanceText}</Text>
            </View>
            {item.price && (
              <View style={styles.detailItem}>
                <Ionicons name="cash" size={16} color="#666" />
                <Text style={styles.detailText}>{item.price}</Text>
              </View>
            )}
          </View>

          {item.workingHours && typeof item.workingHours === 'object' && (
            <View style={styles.availabilityContainer}>
              <Ionicons name="calendar" size={16} color="#00897B" />
              <Text style={styles.availabilityText}>
                {Object.values(item.workingHours).some((day) => day.enabled)
                  ? 'Disponible'
                  : 'Horaires non définis'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterButton = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === item.id && styles.filterButtonActive,
      ]}
      onPress={() => setSelectedFilter(item.id)}
    >
      <Ionicons
        name={item.icon}
        size={16}
        color={selectedFilter === item.id ? '#fff' : '#00897B'}
      />
      <Text
        style={[
          styles.filterButtonText,
          selectedFilter === item.id && styles.filterButtonTextActive,
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un médecin..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={styles.filtersContainer}>
          <FlatList
            data={filters}
            renderItem={renderFilterButton}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersList}
          />
        </View>
      </Animated.View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00897B" />
          <Text style={styles.loadingText}>Chargement des médecins...</Text>
        </View>
      ) : filteredDoctors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="medical-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            {searchQuery
              ? 'Aucun médecin trouvé pour cette recherche'
              : `Aucun médecin disponible pour ${specialty}`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredDoctors}
          renderItem={renderDoctorCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
      )}
    </View>
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
    paddingBottom: 10,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filtersContainer: {
    marginTop: 10,
  },
  filtersList: {
    paddingHorizontal: 15,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#00897B',
  },
  filterButtonActive: {
    backgroundColor: '#00897B',
  },
  filterButtonText: {
    marginLeft: 5,
    color: '#00897B',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 15,
  },
  doctorCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 15,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  doctorImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    color: '#666',
    fontWeight: '600',
  },
  reviews: {
    marginLeft: 4,
    color: '#666',
    fontSize: 12,
  },
  specialty: {
    color: '#00897B',
    marginBottom: 8,
  },
  detailsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  detailText: {
    marginLeft: 4,
    color: '#666',
    fontSize: 12,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2F1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  availabilityText: {
    marginLeft: 4,
    color: '#00897B',
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 20,
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  doctorImagePlaceholder: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
