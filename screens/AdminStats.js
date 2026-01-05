import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllUsers, getAllDoctors, getAllAppointments } from '../services/adminService';

export default function AdminStats({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    cancelledAppointments: 0,
    completedAppointments: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    let usersCount = 0;
    let adminsCount = 0;
    let doctorsCount = 0;
    let appointmentsCount = 0;
    let pendingCount = 0;
    let confirmedCount = 0;
    let cancelledCount = 0;
    let completedCount = 0;

    const unsubscribers = [];

    // Get users stats
    const usersUnsub = getAllUsers((users) => {
      usersCount = users.length;
      adminsCount = users.filter((u) => u.role === 'admin').length;
      updateStats();
    });
    unsubscribers.push(usersUnsub);

    // Get doctors stats
    const doctorsUnsub = getAllDoctors((doctors) => {
      doctorsCount = doctors.length;
      updateStats();
    });
    unsubscribers.push(doctorsUnsub);

    // Get appointments stats
    const appointmentsUnsub = getAllAppointments((appointments) => {
      appointmentsCount = appointments.length;
      pendingCount = appointments.filter((a) => a.status === 'pending').length;
      confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;
      cancelledCount = appointments.filter((a) => a.status === 'cancelled').length;
      completedCount = appointments.filter((a) => a.status === 'completed').length;
      updateStats();
    });
    unsubscribers.push(appointmentsUnsub);

    const updateStats = () => {
      setStats({
        totalUsers: usersCount,
        totalAdmins: adminsCount,
        totalDoctors: doctorsCount,
        totalAppointments: appointmentsCount,
        pendingAppointments: pendingCount,
        confirmedAppointments: confirmedCount,
        cancelledAppointments: cancelledCount,
        completedAppointments: completedCount,
      });
      setLoading(false);
    };

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00897B" />
      </View>
    );
  }

  const statCards = [
    {
      title: 'Utilisateurs',
      value: stats.totalUsers,
      icon: 'people',
      color: '#1976D2',
      backgroundColor: '#E3F2FD',
      details: [
        { label: 'Administrateurs', value: stats.totalAdmins },
        { label: 'Utilisateurs', value: stats.totalUsers - stats.totalAdmins },
      ],
    },
    {
      title: 'Médecins',
      value: stats.totalDoctors,
      icon: 'medical',
      color: '#00897B',
      backgroundColor: '#E0F2F1',
    },
    {
      title: 'Rendez-vous',
      value: stats.totalAppointments,
      icon: 'calendar',
      color: '#7B1FA2',
      backgroundColor: '#F3E5F5',
      details: [
        { label: 'En attente', value: stats.pendingAppointments },
        { label: 'Confirmés', value: stats.confirmedAppointments },
        { label: 'Annulés', value: stats.cancelledAppointments },
        { label: 'Terminés', value: stats.completedAppointments },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="stats-chart" size={40} color="#00897B" />
        <Text style={styles.headerTitle}>Statistiques</Text>
        <Text style={styles.headerSubtitle}>Vue d'ensemble de l'application</Text>
      </View>

      <View style={styles.content}>
        {statCards.map((card, index) => (
          <View key={index} style={styles.statCard}>
            <View style={[styles.statCardHeader, { backgroundColor: card.backgroundColor }]}>
              <View style={styles.statCardIconContainer}>
                <Ionicons name={card.icon} size={32} color={card.color} />
              </View>
              <View style={styles.statCardInfo}>
                <Text style={styles.statCardTitle}>{card.title}</Text>
                <Text style={[styles.statCardValue, { color: card.color }]}>
                  {card.value}
                </Text>
              </View>
            </View>
            {card.details && (
              <View style={styles.statCardDetails}>
                {card.details.map((detail, detailIndex) => (
                  <View key={detailIndex} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{detail.label}</Text>
                    <Text style={styles.detailValue}>{detail.value}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Résumé</Text>
          <View style={styles.summaryContent}>
            <View style={styles.summaryItem}>
              <Ionicons name="people-outline" size={20} color="#666" />
              <Text style={styles.summaryText}>
                {stats.totalUsers} utilisateur{stats.totalUsers > 1 ? 's' : ''} enregistré
                {stats.totalUsers > 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="medical-outline" size={20} color="#666" />
              <Text style={styles.summaryText}>
                {stats.totalDoctors} médecin{stats.totalDoctors > 1 ? 's' : ''} disponible
                {stats.totalDoctors > 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.summaryText}>
                {stats.totalAppointments} rendez-vous au total
              </Text>
            </View>
          </View>
        </View>
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
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00897B',
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  content: {
    padding: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  statCardHeader: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  statCardIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  statCardInfo: {
    flex: 1,
  },
  statCardTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  statCardValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  statCardDetails: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  summaryCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    padding: 20,
    marginTop: 10,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  summaryContent: {
    gap: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
});

