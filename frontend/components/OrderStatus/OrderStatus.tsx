import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './OrderStatus.styles';

export type StatusType = 'Processing' | 'In-transit' | 'Delivered';

interface OrderStatusProps {
  status: StatusType;
}

export default function OrderStatus({ status }: OrderStatusProps) {
  const isProcessing = true; 
  const isInTransit = status === 'In-transit' || status === 'Delivered';
  const isDelivered = status === 'Delivered';

  return (
    <View style={styles.container}>
      <View style={styles.stepContainer}>
        <View style={[styles.circle, isProcessing ? styles.circleActive : styles.circleInactive]}>
          <Text style={isProcessing ? styles.textActive : styles.textInactive}>1</Text>
        </View>
        <Text style={styles.label}>Processing</Text>
      </View>

      <View style={[styles.line, isInTransit ? styles.lineActive : styles.lineInactive]} />

      <View style={styles.stepContainer}>
        <View style={[styles.circle, isInTransit ? styles.circleActive : styles.circleInactive]}>
          <Text style={isInTransit ? styles.textActive : styles.textInactive}>2</Text>
        </View>
        <Text style={styles.label}>In-transit</Text>
      </View>

      <View style={[styles.line, isDelivered ? styles.lineActive : styles.lineInactive]} />

      <View style={styles.stepContainer}>
        <View style={[styles.circle, isDelivered ? styles.circleActive : styles.circleInactive]}>
          <Text style={isDelivered ? styles.textActive : styles.textInactive}>3</Text>
        </View>
        <Text style={styles.label}>Delivered</Text>
      </View>
    </View>
  );
}