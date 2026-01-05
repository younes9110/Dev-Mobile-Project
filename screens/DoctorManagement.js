import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { getAllDoctors, addDoctor, updateDoctor, deleteDoctor } from '../services/adminService';

const specialties = [
  'Généraliste',
  'Dentiste',
  'Cardiologue',
  'Pédiatre',
  'Psychiatre',
  'Ophtalmologue',
  'Dermatologue',
  'Gynécologue',
  'Neurologue',
  'Orthopédiste',
];

export default function DoctorManagement({ navigation }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    experience: '',
    address: '',
    city: '',
    price: '',
    phone: '',
    email: '',
    description: '',
    workingHours: {
      monday: { enabled: false, from: '09:00', to: '17:00' },
      tuesday: { enabled: false, from: '09:00', to: '17:00' },
      wednesday: { enabled: false, from: '09:00', to: '17:00' },
      thursday: { enabled: false, from: '09:00', to: '17:00' },
      friday: { enabled: false, from: '09:00', to: '17:00' },
      saturday: { enabled: false, from: '09:00', to: '13:00' },
      sunday: { enabled: false, from: '09:00', to: '13:00' },
    },
    latitude: null,
    longitude: null,
  });
  const [photoUri, setPhotoUri] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 33.5731, // Default to Casablanca
    longitude: -7.5898,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    const unsubscribe = getAllDoctors((doctorsList) => {
      setDoctors(doctorsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddDoctor = () => {
    setEditingDoctor(null);
    setFormData({
      name: '',
      specialty: '',
      experience: '',
      address: '',
      city: '',
      price: '',
      phone: '',
      email: '',
      description: '',
      workingHours: {
        monday: { enabled: false, from: '09:00', to: '17:00' },
        tuesday: { enabled: false, from: '09:00', to: '17:00' },
        wednesday: { enabled: false, from: '09:00', to: '17:00' },
        thursday: { enabled: false, from: '09:00', to: '17:00' },
        friday: { enabled: false, from: '09:00', to: '17:00' },
        saturday: { enabled: false, from: '09:00', to: '13:00' },
        sunday: { enabled: false, from: '09:00', to: '13:00' },
      },
      latitude: null,
      longitude: null,
    });
    setPhotoUri(null);
    setMapRegion({
      latitude: 33.5731,
      longitude: -7.5898,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
    setModalVisible(true);
  };

  const handleEditDoctor = (doctor) => {
    setEditingDoctor(doctor);
    const defaultWorkingHours = {
      monday: { enabled: false, from: '09:00', to: '17:00' },
      tuesday: { enabled: false, from: '09:00', to: '17:00' },
      wednesday: { enabled: false, from: '09:00', to: '17:00' },
      thursday: { enabled: false, from: '09:00', to: '17:00' },
      friday: { enabled: false, from: '09:00', to: '17:00' },
      saturday: { enabled: false, from: '09:00', to: '13:00' },
      sunday: { enabled: false, from: '09:00', to: '13:00' },
    };
    
    setFormData({
      name: doctor.name || '',
      specialty: doctor.specialty || '',
      experience: doctor.experience || '',
      address: doctor.address || '',
      city: doctor.city || '',
      price: doctor.price || '',
      phone: doctor.phone || '',
      email: doctor.email || '',
      description: doctor.description || '',
      workingHours: typeof doctor.workingHours === 'object' 
        ? { ...defaultWorkingHours, ...doctor.workingHours }
        : defaultWorkingHours,
      latitude: doctor.latitude || null,
      longitude: doctor.longitude || null,
    });
    setPhotoUri(doctor.photo || null);
    if (doctor.latitude && doctor.longitude) {
      setMapRegion({
        latitude: doctor.latitude,
        longitude: doctor.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
    setModalVisible(true);
  };

  const handleDeleteDoctor = (doctorId) => {
    Alert.alert(
      'Supprimer le médecin',
      'Êtes-vous sûr de vouloir supprimer ce médecin ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteDoctor(doctorId);
            if (result.success) {
              Alert.alert('Succès', 'Médecin supprimé avec succès');
            } else {
              Alert.alert('Erreur', result.error || 'Impossible de supprimer le médecin');
            }
          },
        },
      ]
    );
  };

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à vos photos.');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setFormData({
      ...formData,
      latitude,
      longitude,
    });
    setMapRegion({
      ...mapRegion,
      latitude,
      longitude,
    });
  };

  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à votre localisation.');
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;
    setFormData({
      ...formData,
      latitude,
      longitude,
    });
    setMapRegion({
      latitude,
      longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  const updateWorkingHours = (day, field, value) => {
    setFormData({
      ...formData,
      workingHours: {
        ...formData.workingHours,
        [day]: {
          ...formData.workingHours[day],
          [field]: value,
        },
      },
    });
  };

  const formatTime = (time) => {
    return time || '09:00';
  };

  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(timeStr);
    }
  }

  const handleSaveDoctor = async () => {
    if (!formData.name || !formData.specialty) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    const doctorData = {
      ...formData,
      photo: photoUri || '', // Use the selected image URI
      // Rating and reviews will be calculated from user reviews automatically
      // Distance will be calculated based on user location
    };

    let result;
    if (editingDoctor) {
      result = await updateDoctor(editingDoctor.id, doctorData);
    } else {
      result = await addDoctor(doctorData);
    }

    if (result.success) {
      Alert.alert('Succès', editingDoctor ? 'Médecin modifié avec succès' : 'Médecin ajouté avec succès');
      setModalVisible(false);
    } else {
      Alert.alert('Erreur', result.error || 'Une erreur est survenue');
    }
  };

  const renderDoctorItem = ({ item }) => (
    <View style={styles.doctorCard}>
      <View style={styles.doctorInfo}>
        <Text style={styles.doctorName}>{item.name}</Text>
        <Text style={styles.doctorSpecialty}>{item.specialty}</Text>
        <Text style={styles.doctorDetails}>
          {item.experience && `${item.experience} • `}
          {item.city || item.address || ''}
          {item.price && ` • ${item.price}`}
        </Text>
      </View>
      <View style={styles.doctorActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditDoctor(item)}
        >
          <Ionicons name="create-outline" size={20} color="#1976D2" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteDoctor(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#D32F2F" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00897B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddDoctor}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Ajouter un médecin</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={doctors}
        renderItem={renderDoctorItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="medical-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Aucun médecin enregistré</Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingDoctor ? 'Modifier le médecin' : 'Ajouter un médecin'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={true}>
              <Text style={styles.requiredNote}>* Champs obligatoires</Text>
              
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Nom complet *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Entrez le nom complet du médecin"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              <View style={styles.selectContainer}>
                <Text style={styles.selectLabel}>Spécialité *</Text>
                <View style={styles.specialtyGrid}>
                  {specialties.map((spec) => (
                    <TouchableOpacity
                      key={spec}
                      style={[
                        styles.specialtyButton,
                        formData.specialty === spec && styles.specialtyButtonActive,
                      ]}
                      onPress={() => setFormData({ ...formData, specialty: spec })}
                    >
                      <Text
                        style={[
                          styles.specialtyButtonText,
                          formData.specialty === spec && styles.specialtyButtonTextActive,
                        ]}
                      >
                        {spec}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Expérience</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 10 ans"
                  value={formData.experience}
                  onChangeText={(text) => setFormData({ ...formData, experience: text })}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Adresse</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 123 Rue de la Santé"
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Ville</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Paris, Casablanca"
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Localisation sur la carte</Text>
                <TouchableOpacity
                  style={styles.mapPickerButton}
                  onPress={() => setShowMapPicker(true)}
                >
                  <Ionicons name="map-outline" size={20} color="#00897B" />
                  <Text style={styles.mapPickerText}>
                    {formData.latitude && formData.longitude
                      ? 'Localisation définie'
                      : 'Appuyez pour sélectionner sur la carte'}
                  </Text>
                </TouchableOpacity>
                {formData.latitude && formData.longitude && (
                  <Text style={styles.coordinatesText}>
                    {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </Text>
                )}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Prix de consultation</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 30€"
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Heures de travail</Text>
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                  const dayLabels = {
                    monday: 'Lundi',
                    tuesday: 'Mardi',
                    wednesday: 'Mercredi',
                    thursday: 'Jeudi',
                    friday: 'Vendredi',
                    saturday: 'Samedi',
                    sunday: 'Dimanche',
                  };
                  const dayData = formData.workingHours[day];
                  return (
                    <View key={day} style={styles.workingDayRow}>
                      <View style={styles.workingDayHeader}>
                        <Text style={styles.workingDayLabel}>{dayLabels[day]}</Text>
                        <Switch
                          value={dayData.enabled}
                          onValueChange={(value) => updateWorkingHours(day, 'enabled', value)}
                          trackColor={{ false: '#E0E0E0', true: '#00897B' }}
                          thumbColor={dayData.enabled ? '#fff' : '#f4f3f4'}
                        />
                      </View>
                      {dayData.enabled && (
                        <View style={styles.timePickerRow}>
                          <View style={styles.timePickerContainer}>
                            <Text style={styles.timeLabel}>De</Text>
                            <ScrollView style={styles.timePicker} nestedScrollEnabled>
                              {timeOptions.map((time) => (
                                <TouchableOpacity
                                  key={time}
                                  style={[
                                    styles.timeOption,
                                    dayData.from === time && styles.timeOptionSelected,
                                  ]}
                                  onPress={() => updateWorkingHours(day, 'from', time)}
                                >
                                  <Text
                                    style={[
                                      styles.timeOptionText,
                                      dayData.from === time && styles.timeOptionTextSelected,
                                    ]}
                                  >
                                    {time}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                          <View style={styles.timePickerContainer}>
                            <Text style={styles.timeLabel}>À</Text>
                            <ScrollView style={styles.timePicker} nestedScrollEnabled>
                              {timeOptions.map((time) => (
                                <TouchableOpacity
                                  key={time}
                                  style={[
                                    styles.timeOption,
                                    dayData.to === time && styles.timeOptionSelected,
                                  ]}
                                  onPress={() => updateWorkingHours(day, 'to', time)}
                                >
                                  <Text
                                    style={[
                                      styles.timeOptionText,
                                      dayData.to === time && styles.timeOptionTextSelected,
                                    ]}
                                  >
                                    {time}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Téléphone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Numéro de téléphone"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Adresse email"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Photo du médecin</Text>
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={pickImage}
                >
                  {photoUri ? (
                    <Image source={{ uri: photoUri }} style={styles.selectedImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="camera-outline" size={40} color="#666" />
                      <Text style={styles.imagePickerText}>Appuyez pour sélectionner une photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {photoUri && (
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setPhotoUri(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#D32F2F" />
                    <Text style={styles.removeImageText}>Supprimer la photo</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Description du médecin"
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  multiline
                  numberOfLines={4}
                />
              </View>

            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveDoctor}
              >
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Map Picker Modal */}
      <Modal
        visible={showMapPicker}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowMapPicker(false)}
      >
        <View style={styles.mapModalContainer}>
          <View style={styles.mapModalHeader}>
            <Text style={styles.mapModalTitle}>Sélectionner la localisation</Text>
            <View style={styles.mapModalActions}>
              <TouchableOpacity
                style={styles.mapActionButton}
                onPress={getCurrentLocation}
              >
                <Ionicons name="locate" size={20} color="#00897B" />
                <Text style={styles.mapActionText}>Ma position</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.mapCloseButton}
                onPress={() => setShowMapPicker(false)}
              >
                <Text style={styles.mapCloseButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
          <MapView
            style={styles.map}
            region={mapRegion}
            onPress={handleMapPress}
          >
            {formData.latitude && formData.longitude && (
              <Marker
                coordinate={{
                  latitude: formData.latitude,
                  longitude: formData.longitude,
                }}
                title="Localisation du cabinet"
              />
            )}
          </MapView>
          {formData.latitude && formData.longitude && (
            <View style={styles.mapInfo}>
              <Text style={styles.mapInfoText}>
                Localisation: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
              </Text>
              <TouchableOpacity
                style={styles.confirmLocationButton}
                onPress={() => setShowMapPicker(false)}
              >
                <Text style={styles.confirmLocationText}>Confirmer cette localisation</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 15,
    backgroundColor: '#E0F2F1',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00897B',
    padding: 12,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  list: {
    padding: 15,
  },
  doctorCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#00897B',
    marginBottom: 5,
  },
  doctorDetails: {
    fontSize: 12,
    color: '#666',
  },
  doctorActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    marginRight: 10,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    padding: 20,
  },
  requiredNote: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  fieldContainer: {
    marginBottom: 15,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  selectContainer: {
    marginBottom: 15,
  },
  selectLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  specialtyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specialtyButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  specialtyButtonActive: {
    backgroundColor: '#00897B',
    borderColor: '#00897B',
  },
  specialtyButtonText: {
    color: '#666',
    fontSize: 14,
  },
  specialtyButtonTextActive: {
    color: '#fff',
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  ratingField: {
    flex: 1,
  },
  ratingSubLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  ratingInput: {
    marginBottom: 0,
  },
  imagePickerButton: {
    width: '100%',
    minHeight: 150,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  imagePickerText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 8,
    alignSelf: 'flex-start',
  },
  removeImageText: {
    marginLeft: 5,
    color: '#D32F2F',
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#00897B',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mapPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2F1',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  mapPickerText: {
    marginLeft: 10,
    color: '#00897B',
    fontSize: 16,
  },
  coordinatesText: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  workingDayRow: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  workingDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  workingDayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  timePickerContainer: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  timePicker: {
    maxHeight: 150,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  timeOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  timeOptionSelected: {
    backgroundColor: '#00897B',
  },
  timeOptionText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  timeOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapModalHeader: {
    padding: 15,
    backgroundColor: '#E0F2F1',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  mapModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00897B',
    marginBottom: 10,
  },
  mapModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  mapActionText: {
    marginLeft: 5,
    color: '#00897B',
    fontSize: 14,
  },
  mapCloseButton: {
    padding: 8,
    backgroundColor: '#00897B',
    borderRadius: 8,
  },
  mapCloseButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
  mapInfo: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  mapInfoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  confirmLocationButton: {
    backgroundColor: '#00897B',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmLocationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

