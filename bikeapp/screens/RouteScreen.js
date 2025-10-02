// RouteScreen.js
import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { TouchableOpacity } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import config from "../conn.json";

/**
 * Start:
 *   - Current Location
 *   - Choose on Map
 * Destination:
 *   - Choose on Map
 *   - Closest Bike Pump
 *   - Closest Bike Parking
 * Route shows after both picked.
 */

export default function RouteScreen() {
  const [start, setStart] = useState(null); // {latitude, longitude}
  const [end, setEnd] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]); // LineString or MultiLineString

  const [selectMode, setSelectMode] = useState("idle"); // 'idle' | 'chooseStart' | 'chooseEnd'
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  const mapRef = useRef(null);

  // ask location permission so we can show the user dot
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(status === "granted");
      if (status !== "granted") console.warn("Location permission not granted.");
    })();
  }, []);

  // map click when choosing on map
  const onMapPress = useCallback(
    (e) => {
      const coord = e.nativeEvent.coordinate;
      if (selectMode === "chooseStart") {
        setStart(coord);
        setRouteCoords([]);
        setSelectMode("chooseEnd");
      } else if (selectMode === "chooseEnd") {
        setEnd(coord);
        setRouteCoords([]);
        setSelectMode("idle");
      }
    },
    [selectMode]
  );

  // fit map to route
  useEffect(() => {
    if (!routeCoords || routeCoords.length === 0) return;

    const isMulti =
      Array.isArray(routeCoords[0]) &&
      routeCoords[0].length &&
      typeof routeCoords[0][0]?.latitude === "number";

    let allCoords = [];
    if (isMulti) {
      allCoords = routeCoords.flat();
    } else {
      allCoords = routeCoords;
    }

    if (mapRef.current && allCoords.length > 0) {
      mapRef.current.fitToCoordinates(allCoords, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [routeCoords]);

  // helpers
  const ensureLocationPermission = async () => {
    if (hasLocationPermission) return true;
    const { status } = await Location.requestForegroundPermissionsAsync();
    const ok = status === "granted";
    setHasLocationPermission(ok);
    if (!ok) Alert.alert("Permission needed", "Location permission is required.");
    return ok;
  };

  const centerOn = (coord) => {
    if (!mapRef.current || !coord) return;
    mapRef.current.animateToRegion(
      {
        latitude: coord.latitude,
        longitude: coord.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      500
    );
  };

  const useCurrentLocationForStart = async () => {
    try {
      const ok = await ensureLocationPermission();
      if (!ok) return;
      const loc = await Location.getCurrentPositionAsync({});
      const coord = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setStart(coord);
      setRouteCoords([]);
      setSelectMode("chooseEnd");
      centerOn(coord);
    } catch (err) {
      console.error("Error getting current location:", err);
      Alert.alert("Error", "Could not get current location.");
    }
  };

  const armChooseOnMapForStart = () => {
    setSelectMode("chooseStart");
    setRouteCoords([]);
  };
  const armChooseOnMapForEnd = () => {
    if (!start) {
      setSelectMode("chooseStart");
      return;
    }
    setSelectMode("chooseEnd");
    setRouteCoords([]);
  };

  // fetch closest Pump / Parking relative to START (fallback: current location)
  const pickClosestDestination = async (type /* 'pump' | 'parking' */) => {
    try {
      let refCoord = start;
      if (!refCoord) {
        const ok = await ensureLocationPermission();
        if (!ok) return;
        const loc = await Location.getCurrentPositionAsync({});
        refCoord = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        // optional UX: set this as Start if none chosen
        setStart(refCoord);
      }

      const lon = refCoord.longitude;
      const lat = refCoord.latitude;

      const endpoint =
        type === "pump"
          ? `get_pumps_geojson_closest`
          : `get_parking_geojson_closest`;

      // If your endpoint supports &limit=1 it will reduce payload.
      const url = `http://${config.app.api_base_IP}:${config.app.port}/api/${endpoint}?lon=${lon}&lat=${lat}&limit=1`;
      const res = await fetch(url);
      if (!res.ok) {
        const txt = await res.text();
        console.warn("Closest fetch error", res.status, txt.slice(0, 300));
        Alert.alert("Error", `Could not get closest ${type}.`);
        return;
      }
      const data = await res.json();

      // Handle both possible shapes:
      // 1) GeoJSON FeatureCollection { features: [...] }
      // 2) [{ row_to_json: { features: [...] } }] (as in your earlier code)
      const features =
        data?.features ??
        data?.[0]?.row_to_json?.features ??
        [];

      if (!features.length || !features[0]?.geometry) {
        Alert.alert("Not found", `No ${type} found.`);
        return;
      }

      const geom = features[0].geometry;
      // Expecting Point geometry: [lon, lat]
      if (geom.type !== "Point" || !Array.isArray(geom.coordinates)) {
        Alert.alert("Unsupported", `Closest ${type} is not a point geometry.`);
        return;
      }

      const [elon, elat] = geom.coordinates;
      const coord = { latitude: elat, longitude: elon };

      setEnd(coord);
      setRouteCoords([]);
      setSelectMode("idle");
      centerOn(coord);
    } catch (err) {
      console.error("Closest selection failed:", err);
      Alert.alert("Error", `Failed to find closest ${type}.`);
    }
  };

  const fetchRoute = async () => {
    if (!start || !end) return;

    const qs = `start=${start.longitude},${start.latitude}&end=${end.longitude},${end.latitude}`;
    try {
      const url = `http://${config.app.api_base_IP}:${config.app.port}/api/route?${qs}`;
      const resp = await fetch(url);

      if (!resp.ok) {
        const txt = await resp.text();
        Alert.alert("Route error", `${resp.status}: ${txt.slice(0, 200)}`);
        return;
      }

      const ct = resp.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const txt = await resp.text();
        console.warn("Non-JSON response:", ct, txt.slice(0, 400));
        Alert.alert("Server Error", "Server returned non-JSON (see console).");
        return;
      }

      const feat = await resp.json();
      const g = feat?.geometry;

      if (!g?.type || !g?.coordinates) {
        Alert.alert("No route found", "Try choosing different points.");
        return;
      }

      if (g.type === "LineString") {
        const coords = g.coordinates.map(([lon, lat]) => ({
          latitude: lat,
          longitude: lon,
        }));
        setRouteCoords(coords);
        return;
      }

      if (g.type === "MultiLineString") {
        const segments = g.coordinates.map((seg) =>
          seg.map(([lon, lat]) => ({ latitude: lat, longitude: lon }))
        );
        setRouteCoords(segments);
        return;
      }

      Alert.alert("No route found", "Unsupported geometry type.");
    } catch (err) {
      console.error("Fetch failed:", err);
      Alert.alert("Network error", "Error fetching route");
    }
  };

  const renderPolyline = () => {
    if (!routeCoords || routeCoords.length === 0) return null;

    const isMulti =
      Array.isArray(routeCoords[0]) &&
      routeCoords[0].length &&
      typeof routeCoords[0][0]?.latitude === "number";

    if (isMulti) {
      return routeCoords.map((seg, i) => {
        if (!seg || seg.length === 0) return null;
        const s = seg[0];
        const e = seg[seg.length - 1];
        const key = `seg-${s.longitude.toFixed(6)},${s.latitude.toFixed(
          6
        )}->${e.longitude.toFixed(6)},${e.latitude.toFixed(6)}-${i}`;
        return (
          <Polyline
            key={key}
            coordinates={seg}
            strokeWidth={4}
            strokeColor="#FF0000"
            zIndex={999}
          />
        );
      });
    }

    const s = routeCoords[0];
    const e = routeCoords[routeCoords.length - 1];
    const key =
      s && e
        ? `line-${s.longitude.toFixed(6)},${s.latitude.toFixed(
            6
          )}->${e.longitude.toFixed(6)},${e.latitude.toFixed(6)}`
        : "line-0";

    return (
      <Polyline
        key={key}
        coordinates={routeCoords}
        strokeWidth={4}
        strokeColor="#FF0000"
        zIndex={999}
      />
    );
  };

  const canRoute = !!start && !!end;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        onPress={onMapPress}
        initialRegion={{
          latitude: 59.3293,
          longitude: 18.0686,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={hasLocationPermission}
        showsMyLocationButton
      >
        {start && <Marker coordinate={start} title="Start" pinColor="green" />}
        {end && <Marker coordinate={end} title="End" pinColor="red" />}
        {renderPolyline()}
      </MapView>

      {/* Bottom picker */}
      <View style={styles.bottomMenu}>
        {/* START */}
        <View
          style={[
            styles.row,
            selectMode === "chooseStart" ? styles.rowActive : null,
          ]}
        >
          <Text style={styles.rowTitle}>Start</Text>
          <View style={styles.rowButtons}>
            <TouchableOpacity
              style={styles.translucentBtn}
              onPress={useCurrentLocationForStart}
            >
              <Text style={styles.btnText}>Current Location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.translucentBtn}
              onPress={armChooseOnMapForStart}
            >
              <Text style={styles.btnText}>Choose on Map</Text>
            </TouchableOpacity>
          </View>
          {start && (
            <Text style={styles.smallNote}>
              Selected ✓ ({start.latitude.toFixed(5)}, {start.longitude.toFixed(5)})
            </Text>
          )}
        </View>

        {/* DESTINATION */}
        <View
          style={[
            styles.row,
            selectMode === "chooseEnd" ? styles.rowActive : null,
          ]}
        >
          <Text style={styles.rowTitle}>Destination</Text>
          <View style={styles.rowButtonsWrap}>
            <TouchableOpacity
              style={styles.translucentBtn}
              onPress={armChooseOnMapForEnd}
            >
              <Text style={styles.btnText}>Choose on Map</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.translucentBtn}
              onPress={() => pickClosestDestination("pump")}
            >
              <Text style={styles.btnText}>Closest Bike Pump</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.translucentBtn}
              onPress={() => pickClosestDestination("parking")}
            >
              <Text style={styles.btnText}>Closest Bike Parking</Text>
            </TouchableOpacity>
          </View>
          {end && (
            <Text style={styles.smallNote}>
              Selected ✓ ({end.latitude.toFixed(5)}, {end.longitude.toFixed(5)})
            </Text>
          )}
        </View>

        {canRoute && (
          <TouchableOpacity style={styles.routeCta} onPress={fetchRoute}>
            <Text style={styles.routeCtaText}>Get Route</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  bottomMenu: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    gap: 10,
  },

  row: {
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowActive: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
  },
  rowTitle: {
    color: "white",
    fontWeight: "600",
    marginBottom: 6,
  },
  rowButtons: {
    flexDirection: "row",
    gap: 10,
  },
  rowButtonsWrap: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  translucentBtn: {
    flexGrow: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: {
    color: "white",
    fontWeight: "600",
    textAlign: "center",
  },
  smallNote: {
    color: "white",
    opacity: 0.9,
    marginTop: 6,
    fontSize: 12,
  },

  routeCta: {
    backgroundColor: "#1E90FF",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  routeCtaText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});
