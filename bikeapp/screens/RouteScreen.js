import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, Button, StyleSheet } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import config from "../conn.json";

export default function RouteScreen() {
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  // Either an array of coords (LineString) or array of arrays (MultiLineString)
  const [routeCoords, setRouteCoords] = useState([]);
  const mapRef = useRef(null);

  const onMapPress = useCallback(
    (e) => {
      const coord = e.nativeEvent.coordinate;
      if (!start) setStart(coord);
      else if (!end) setEnd(coord);
      else {
        setStart(coord);
        setEnd(null);
        setRouteCoords([]);
      }
    },
    [start, end]
  );

  // After routeCoords change, fit the map to show the whole route and log what's drawn
  useEffect(() => {
    if (!routeCoords || routeCoords.length === 0) return;

    // Determine if MultiLineString (array of segments) or LineString (single array)
    const isMulti =
      Array.isArray(routeCoords[0]) &&
      routeCoords[0].length &&
      typeof routeCoords[0][0]?.latitude === "number";

    let allCoords = [];
    if (isMulti) {
      console.log(`[DRAW] MultiLineString with ${routeCoords.length} segment(s).`);
      allCoords = routeCoords.flat();
    } else {
      console.log(`[DRAW] LineString with ${routeCoords.length} points.`);
      allCoords = routeCoords;
    }

    if (mapRef.current && allCoords.length > 0) {
      mapRef.current.fitToCoordinates(allCoords, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [routeCoords]);

  const fetchRoute = async () => {
    if (!start || !end) return;

    const qs = `start=${start.longitude},${start.latitude}&end=${end.longitude},${end.latitude}`;

    try {
      const url = `http://${config.app.api_base_IP}:${config.app.port}/api/route?${qs}`;
      console.log("Routing URL:", url);

      const resp = await fetch(url);

      if (!resp.ok) {
        const txt = await resp.text();
        console.warn("Route HTTP error", resp.status, txt.slice(0, 400));
        alert(`Route error ${resp.status}: ${txt.slice(0, 200)}`);
        return;
      }

      const ct = resp.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const txt = await resp.text();
        console.warn("Non-JSON response:", ct, txt.slice(0, 400));
        alert("Server returned non-JSON (see console).");
        return;
      }

      const feat = await resp.json();
      const g = feat?.geometry;

      if (!g?.type || !g?.coordinates) {
        console.warn("Unexpected or missing geometry:", g);
        alert("No route found");
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

      console.warn("Unsupported geometry type:", g.type);
      alert("No route found");
    } catch (err) {
      console.error("Fetch failed:", err);
      alert("Error fetching route");
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
        // stable-ish key from endpoints (rounded to avoid floating noise)
        const key = `seg-${s.longitude.toFixed(6)},${s.latitude.toFixed(6)}->${e.longitude.toFixed(6)},${e.latitude.toFixed(6)}-${i}`;
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
  
    // Single LineString
    const s = routeCoords[0];
    const e = routeCoords[routeCoords.length - 1];
    const key = s && e
      ? `line-${s.longitude.toFixed(6)},${s.latitude.toFixed(6)}->${e.longitude.toFixed(6)},${e.latitude.toFixed(6)}`
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
      >
        {start && <Marker coordinate={start} title="Start" pinColor="green" />}
        {end && <Marker coordinate={end} title="End" pinColor="red" />}
        {renderPolyline()}
      </MapView>

      <View style={styles.buttonContainer}>
        <Button title="Get Route" onPress={fetchRoute} disabled={!start || !end} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  buttonContainer: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
  },
});
