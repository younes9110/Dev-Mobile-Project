import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllUsers, deleteUser, updateUser, setUserAsAdmin } from '../services/adminService';

export default function UserManagement({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = getAllUsers((usersList) => {
      setUsers(usersList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter((user) =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteUser = (userId, userName) => {
    Alert.alert(
      'Supprimer l\'utilisateur',
      `Êtes-vous sûr de vouloir supprimer ${userName || 'cet utilisateur'} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteUser(userId);
            if (result.success) {
              Alert.alert('Succès', 'Utilisateur supprimé avec succès');
            } else {
              Alert.alert('Erreur', result.error || 'Impossible de supprimer l\'utilisateur');
            }
          },
        },
      ]
    );
  };

  const handleMakeAdmin = (userId, userName) => {
    Alert.alert(
      'Promouvoir en administrateur',
      `Voulez-vous promouvoir ${userName || 'cet utilisateur'} en administrateur ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Promouvoir',
          onPress: async () => {
            const result = await setUserAsAdmin(userId);
            if (result.success) {
              Alert.alert('Succès', 'Utilisateur promu administrateur avec succès');
            } else {
              Alert.alert('Erreur', result.error || 'Impossible de promouvoir l\'utilisateur');
            }
          },
        },
      ]
    );
  };

  const handleRemoveAdmin = (userId, userName) => {
    Alert.alert(
      'Retirer les droits d\'administrateur',
      `Voulez-vous retirer les droits d'administrateur à ${userName || 'cet utilisateur'} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          onPress: async () => {
            const result = await updateUser(userId, { role: 'user' });
            if (result.success) {
              Alert.alert('Succès', 'Droits d\'administrateur retirés avec succès');
            } else {
              Alert.alert('Erreur', result.error || 'Impossible de retirer les droits');
            }
          },
        },
      ]
    );
  };

  const renderUserItem = ({ item }) => {
    const isAdmin = item.role === 'admin';
    const createdAt = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('fr-FR')
      : 'N/A';

    return (
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          <View style={styles.userHeader}>
            <Text style={styles.userName}>{item.name || 'Sans nom'}</Text>
            {isAdmin && (
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#fff" />
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
          </View>
          <Text style={styles.userEmail}>{item.email}</Text>
          <Text style={styles.userPhone}>{item.phone || 'Pas de téléphone'}</Text>
          <Text style={styles.userDate}>Inscrit le: {createdAt}</Text>
        </View>
        <View style={styles.userActions}>
          {!isAdmin && (
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => handleMakeAdmin(item.id, item.name)}
            >
              <Ionicons name="shield-outline" size={18} color="#1976D2" />
            </TouchableOpacity>
          )}
          {isAdmin && (
            <TouchableOpacity
              style={styles.removeAdminButton}
              onPress={() => handleRemoveAdmin(item.id, item.name)}
            >
              <Ionicons name="shield" size={18} color="#F57C00" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteUser(item.id, item.name)}
          >
            <Ionicons name="trash-outline" size={18} color="#D32F2F" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un utilisateur..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{users.length}</Text>
          <Text style={styles.statLabel}>Total utilisateurs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {users.filter((u) => u.role === 'admin').length}
          </Text>
          <Text style={styles.statLabel}>Administrateurs</Text>
        </View>
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur enregistré'}
            </Text>
          </View>
        }
      />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#E0F2F1',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00897B',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  list: {
    padding: 15,
  },
  userCard: {
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
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00897B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  userPhone: {
    fontSize: 12,
    color: '#999',
    marginBottom: 3,
  },
  userDate: {
    fontSize: 11,
    color: '#999',
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adminButton: {
    padding: 8,
  },
  removeAdminButton: {
    padding: 8,
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
});

