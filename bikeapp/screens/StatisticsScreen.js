import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import MapView from 'react-native-maps';
import { Geojson } from 'react-native-maps';
import * as turf from '@turf/turf';
import { fetchParkings_all } from '../utils/fetchMapData';
import { fetchParkingAverage } from '../utils/fetchRatings';

export default function StatisticsScreen() {
    const [heatmapZones, setHeatmapZones] = useState([]);
    const [totalParkings, setTotalParkings] = useState(0);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const allParkings = await fetchParkings_all(59.334591, 18.063240);
            setTotalParkings(allParkings.length);
            console.log("all parkings loaded")


            const enrichedParkings = await Promise.all(
                allParkings.map(async (p) => {
                    try {
                        const avg = await fetchParkingAverage(p.properties.fid);
                        //console.log(`FID ${p.properties.fid} → fetchParkingAverage:`, avg);
                        return {
                            ...p,
                            safety_rating: avg?.avg_safety ?? null,
                            availability_rating: avg?.avg_availability ?? null,
                            vibe_rating: avg?.avg_vibe ?? null
                        };
                    } catch (err) {
                        console.error(`Fehler bei Parking ${p.properties.fid}:`, err);
                        return { ...p, safety_rating: null };
                    }
                })
            );
            //console.log('Enriched parkings:', enrichedParkings);

            console.log("all averages fetched")

            const points = enrichedParkings
                .filter(p => p.safety_rating !== null)
                .map(p => turf.point(p.geometry.coordinates, { value: parseFloat(p.safety_rating) }));

            const pointCollection = turf.featureCollection(points);

            //console.log('Turf points count:', points.length);
            console.log('Sample point:', points[0]);
            //console.log('Point collection:', pointCollection);

            // Bounding box + grid
            const bbox = turf.bbox(pointCollection);
            const grid = turf.squareGrid(bbox, 0.01, { units: 'degrees' });

            console.log('Bounding Box:', bbox);


            try {
                const aggregated = grid.features.map(cell => {
                    const ptsInCell = turf.pointsWithinPolygon(pointCollection, cell);
                    const values = ptsInCell.features.map(f => f.properties.value);
                    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
                    return turf.feature(cell.geometry, { value: avg });
                });

                setHeatmapZones(aggregated.filter(f => f.properties.value !== null));
                console.log("grid created successfully... waiting for visualisation")
            } catch (err) {
                console.error('Fehler bei turf.interpolate:', err);
            }
            
            
            setLoading(false);
        }

        loadData();
    }, []);

    if (loading) {
        return (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#333" />
            <Text style={{ marginTop: 10 }}>loads parkings and creating heatmap (takes approx 3 minutes)</Text>
          </View>
        );
      }


    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: 59.33,
                    longitude: 18.06,
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1,
                }}
            >
                {heatmapZones.map((zone, index) => (
                    <Geojson
                        key={index}
                        geojson={{
                            type: 'FeatureCollection',
                            features: [zone]
                        }}
                        strokeColor="transparent"
                        fillColor={getColor(zone.properties.value ?? 0)}
                        strokeWidth={1}
                    />
                ))}
            </MapView>

            <View style={styles.overlay}>
                <Text style={styles.title}>📊 Safety Map</Text>
                <Text>Total Parkings: {totalParkings}</Text>
            </View>
            <View style={styles.overlay}>
                <Text style={styles.title}>📊 Safety Map</Text>
                <Text>Total Parkings: {totalParkings}</Text>
                {loading && <Text style={styles.loading}>Loading...</Text>}
                <View style={styles.legend}>
                    <Text style={styles.legendTitle}>legend:</Text>
                    <View style={styles.legendRow}><View style={[styles.colorBox, { backgroundColor: 'rgba(0,200,0,0.4)' }]} /><Text>Very safe (≥ 4)</Text></View>
                    <View style={styles.legendRow}><View style={[styles.colorBox, { backgroundColor: 'rgba(255,255,0,0.4)' }]} /><Text>safe (≥ 3)</Text></View>
                    <View style={styles.legendRow}><View style={[styles.colorBox, { backgroundColor: 'rgba(255,165,0,0.4)' }]} /><Text>middle (≥ 2)</Text></View>
                    <View style={styles.legendRow}><View style={[styles.colorBox, { backgroundColor: 'rgba(255,0,0,0.4)' }]} /><Text>not safe (&lt; 2)</Text></View>
                </View>
            </View>

        </View>
    );
}

function getColor(value) {
    if (value >= 4) return 'rgba(0,200,0,0.4)';     // green
    if (value >= 3) return 'rgba(255,255,0,0.4)';   // yellow
    if (value >= 2) return 'rgba(255,165,0,0.4)';   // orange
    return 'rgba(255,0,0,0.4)';                     // red
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    overlay: {
        position: 'absolute',
        top: 20,
        left: 20,
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 8,
        elevation: 5
    },
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    loading: {
        marginTop: 8,
        fontStyle: 'italic',
        color: 'gray'
    }

});