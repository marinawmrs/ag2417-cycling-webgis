import React from 'react';
import { Modal, View, Text, TouchableOpacity, Button, StyleSheet } from 'react-native';

export default function PumpDetailsModal({
  visible,
  feature,
  averageBikepump,
  bikepumpRatings,
  setBikepumpRatings,
  onSubmit,
  onClose
}) {
  if (!feature) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalBackground}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {feature.properties?.name}
          </Text>
          <Text>{feature.properties?.address}</Text>
          <Text>Type: {feature.properties?.type}</Text>

          {averageBikepump ? (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontWeight: 'bold' }}>
                Ratings (last 10 weeks):
              </Text>
              <Text>
                Status:{' '}
                {averageBikepump.majority_working === 1 ? 'Working' : 'Broken'}
              </Text>
              <Text>Vibe: {averageBikepump.avg_vibe}</Text>

              <Text style={{ marginTop: 10, fontWeight: 'bold' }}>
                Your Rating:
              </Text>

              <Text>🛠 Working status</Text>
              <View style={styles.row}>
                {[1, 0].map((value) => {
                  const isSelected = bikepumpRatings.working_status === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() =>
                        setBikepumpRatings((prev) => ({
                          ...prev,
                          working_status: value
                        }))
                      }
                      style={[
                        styles.optionButton,
                        { backgroundColor: isSelected ? '#4CAF50' : '#eee' }
                      ]}
                    >
                      <Text style={{ color: isSelected ? 'white' : 'black' }}>
                        {value === 1 ? 'Working' : 'Broken'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text>🎵 Vibe</Text>
              <View style={styles.row}>
                {[1, 2, 3, 4, 5].map((value) => {
                  const isSelected = bikepumpRatings.vibe_rating === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() =>
                        setBikepumpRatings((prev) => ({
                          ...prev,
                          vibe_rating: value
                        }))
                      }
                      style={[
                        styles.optionButton,
                        { backgroundColor: isSelected ? '#4CAF50' : '#eee' }
                      ]}
                    >
                      <Text style={{ color: isSelected ? 'white' : 'black' }}>
                        {value}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : (
            <Text style={{ marginTop: 10 }}>Loading average ratings…</Text>
          )}

          <Button title="Submit Rating" onPress={onSubmit} />
          <Button title="Close" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  row: {
    flexDirection: 'row',
    marginVertical: 5
  },
  optionButton: {
    padding: 10,
    marginRight: 10,
    borderRadius: 5
  }
});
