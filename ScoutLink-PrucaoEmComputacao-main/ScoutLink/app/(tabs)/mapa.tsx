import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, Dimensions
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { ScoutColors, Spacing, Radius, Typography } from '@/constants/theme';

interface UEL {
  id: string;
  nome: string;
  distrito: string | null;
  endereco: string | null;
  latitude: number | null;
  longitude: number | null;
  distancia?: string;
  distanceValue?: number;
}

// Haversine formula to calculate distance between two lat/lng points in km
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; 
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export default function MapaScreen() {
  const [uels, setUels] = useState<UEL[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    (async () => {
      // 1. Fetch UELs from Backend
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/uels`);
        if (response.ok) {
          const data = await response.json();
          setUels(data);
        } else {
          console.error("Failed to fetch UELs");
        }
      } catch (error) {
        console.error("Error fetching UELS:", error);
      }

      // 2. Ask for Location Permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão Negada', 'Não podemos calcular a UEL mais próxima sem sua localização.');
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      setLoading(false);
    })();
  }, []);

  // Process data to calculate distances if location is available
  const processedUels = React.useMemo(() => {
    if (!location) return uels;
    
    return uels.map(uel => {
      if (!uel.latitude || !uel.longitude) {
        return { ...uel, distanceValue: 9999, distancia: 'Distância indisponível' };
      }
      
      const dist = getDistanceFromLatLonInKm(
        location.coords.latitude, 
        location.coords.longitude, 
        uel.latitude, 
        uel.longitude
      );
      return {
        ...uel,
        distanceValue: dist,
        distancia: dist < 1 ? `${(dist * 1000).toFixed(0)} m` : `${dist.toFixed(1)} km`
      };
    }).sort((a, b) => (a.distanceValue || 0) - (b.distanceValue || 0));
  }, [uels, location]);

  const mapRegion = location ? {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  } : {
    // Default to Brasilia
    latitude: -15.7975,
    longitude: -47.8919,
    latitudeDelta: 0.2,
    longitudeDelta: 0.2,
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🗺️  Mapa de UELs</Text>
        <Text style={styles.headerSub}>Localize o grupo mais próximo</Text>
      </View>

      <View style={{ flex: 1, backgroundColor: ScoutColors.bgBase }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Map View */}
        <View style={styles.mapContainer}>
          {loading ? (
            <ActivityIndicator size="large" color={ScoutColors.orange} style={{ marginTop: 50 }} />
          ) : (
            <MapView 
              style={styles.map} 
              initialRegion={mapRegion}
              showsUserLocation={true}
              showsMyLocationButton={true}
              provider={PROVIDER_GOOGLE}
            >
              {processedUels.filter(u => u.latitude && u.longitude).map(uel => (
                <Marker 
                  key={uel.id}
                  coordinate={{ latitude: uel.latitude!, longitude: uel.longitude! }}
                  title={uel.nome}
                  description={uel.endereco || uel.distrito || ''}
                  pinColor={uel.distanceValue === processedUels[0]?.distanceValue ? ScoutColors.orange : ScoutColors.navy}
                />
              ))}
            </MapView>
          )}
        </View>

        {processedUels.length > 0 && location && (
          <View style={styles.closestBox}>
            <Text style={styles.closestTitle}>📍 UEL Mais Próxima de Você:</Text>
            <Text style={styles.closestName}>{processedUels[0].nome}</Text>
            <Text style={styles.closestDist}>Apenas {processedUels[0].distancia} de distância!</Text>
          </View>
        )}

        {/* List header */}
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Todas as UELs da Região</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{processedUels.length} grupos</Text>
          </View>
        </View>

        <View style={styles.list}>
          {processedUels.map((uel) => (
              <TouchableOpacity key={uel.id} style={styles.card} activeOpacity={0.85}>
                <View style={styles.cardLeft}>
                  <View style={styles.uelIcon}><Text style={{ fontSize: 22 }}>⚜️</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.uelName}>{uel.nome}</Text>
                    <Text style={styles.uelSub}>📍 {uel.distrito || 'DF'} {uel.distancia ? `· ${uel.distancia}` : ''}</Text>
                    <Text style={styles.uelAddress} numberOfLines={2}>{uel.endereco || 'Endereço não cadastrado'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
          ))}
        </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ScoutColors.navy },
  header: { paddingHorizontal: Spacing.md, paddingVertical: 14, backgroundColor: ScoutColors.navy },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  scroll: { paddingTop: Spacing.md, paddingBottom: Spacing.xxl },

  mapContainer: {
    margin: Spacing.md,
    height: 300,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1, 
    borderColor: ScoutColors.borderMedium,
  },
  map: {
    width: '100%',
    height: '100%',
  },

  closestBox: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: ScoutColors.bgNavyTint,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: ScoutColors.borderNavy,
    padding: Spacing.md,
    alignItems: 'center',
  },
  closestTitle: { fontSize: 13, fontWeight: '600', color: ScoutColors.navy, marginBottom: 4 },
  closestName: { fontSize: 18, fontWeight: '800', color: ScoutColors.orange, marginBottom: 2 },
  closestDist: { fontSize: 13, color: ScoutColors.navy },

  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: ScoutColors.navy },
  countBadge: { backgroundColor: ScoutColors.bgWhite, borderRadius: Radius.full, paddingVertical: 4, paddingHorizontal: 12, borderWidth: 1, borderColor: ScoutColors.borderLight },
  countText: { ...Typography.caption },

  list: { paddingHorizontal: Spacing.md, gap: 10 },
  card: {
    backgroundColor: ScoutColors.bgWhite, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: ScoutColors.borderLight,
    padding: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 10 },
  uelIcon: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: ScoutColors.bgNavyTint, borderWidth: 1, borderColor: ScoutColors.borderNavy, alignItems: 'center', justifyContent: 'center' },
  uelName: { fontSize: 13, fontWeight: '600', color: ScoutColors.navy, marginBottom: 3 },
  uelSub: { ...Typography.caption },
  uelAddress: { fontSize: 11, color: '#666', marginTop: 2 },
});
