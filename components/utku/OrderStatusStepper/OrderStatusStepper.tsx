import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const STEPS = ['processing', 'in-transit', 'delivered'];

export default function OrderStatusStepper({ currentStatus }: { currentStatus: string }) {
  const currentIndex = STEPS.indexOf(currentStatus);

  return (
    <View style={styles.container}>
      {STEPS.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isActive = index === currentIndex;
        
        return (
          <React.Fragment key={step}>
            <View style={styles.stepContainer}>
              <View style={[styles.circle, isCompleted ? styles.activeCircle : styles.inactiveCircle]}>
                {isCompleted ? <Text style={styles.check}>✓</Text> : <Text style={styles.number}>{index + 1}</Text>}
              </View>
              <Text style={[styles.label, isActive ? styles.activeLabel : (isCompleted ? styles.completedLabel : styles.inactiveLabel)]}>
                {step.toUpperCase()}
              </Text>
            </View>
            
            {index < STEPS.length - 1 && (
              <View style={[styles.line, index < currentIndex ? styles.activeLine : styles.inactiveLine]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 30, width: '100%', maxWidth: 500, alignSelf: 'center' },
  stepContainer: { alignItems: 'center', width: 100 },
  circle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  activeCircle: { backgroundColor: '#5A7D71' },
  inactiveCircle: { backgroundColor: '#E0E0E0' },
  check: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  number: { color: '#888', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  label: { fontFamily: 'Montserrat_600SemiBold', fontSize: 12 },
  activeLabel: { color: '#5A7D71' },
  completedLabel: { color: '#222' },
  inactiveLabel: { color: '#aaa' },
  line: { flex: 1, height: 2, marginHorizontal: -20, marginBottom: 25, zIndex: -1 },
  activeLine: { backgroundColor: '#5A7D71' },
  inactiveLine: { backgroundColor: '#E0E0E0' }
});
