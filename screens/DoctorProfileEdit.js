import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateDoctor } from '../services/adminService';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';

export default function DoctorProfileEdit({ route, navigation }) {
  const { doctor } = route.params;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: doctor.name || '',
    specialty: doctor.specialty || '',
    experience: doctor.experience || '',
    address: doctor.address || '',
    city: doctor.city || '',
    price: doctor.price || '',
    phone: doctor.phone || '',
    email: doctor.email || '',
    description: doctor.description || '',
  });
  const [photoUri, setPhotoUri] = useState(doctor.photo || null);

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

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à vos photos.');
      return;
    }

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

  const handleSave = async () => {
    if (!formData.name || !formData.specialty) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);

    try {
      const doctorData = {
        ...formData,
        photo: photoUri || '',
      };

      const result = await updateDoctor(doctor.id, doctorData);

      if (result.success) {
        Alert.alert('Succès', 'Profil mis à jour avec succès', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de mettre à jour le profil');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Modifier mon profil</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Photo</Text>
          <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.selectedImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={40} color="#666" />
                <Text style={styles.imagePickerText}>Appuyez pour sélectionner une photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Nom complet *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nom complet"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Spécialité *</Text>
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
            placeholder="Adresse"
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Ville</Text>
          <TextInput
            style={styles.input}
            placeholder="Ville"
            value={formData.city}
            onChangeText={(text) => setFormData({ ...formData, city: text })}
          />
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
          <Text style={styles.fieldLabel}>Téléphone</Text>
          <TextInput
            style={styles.input}
            placeholder="Téléphone"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={formData.email}
            editable={false}
          />
          <Text style={styles.helpText}>L'email ne peut pas être modifié</Text>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
          )}
        </TouchableOpacity>
      </View>
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
    padding: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00897B',
  },
  form: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: '#E0E0E0',
    color: '#666',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  specialtyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  specialtyButton: {
    backgroundColor: '#E0F2F1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00897B',
  },
  specialtyButtonActive: {
    backgroundColor: '#00897B',
  },
  specialtyButtonText: {
    color: '#00897B',
    fontSize: 14,
    fontWeight: '500',
  },
  specialtyButtonTextActive: {
    color: '#fff',
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
  saveButton: {
    backgroundColor: '#00897B',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

