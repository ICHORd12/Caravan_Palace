import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  stepContainer: {
    alignItems: 'center',
    width: 80,
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    width: 30,
    height: 30,
    marginBottom: 8,
  },
  circleActive: {
    backgroundColor: '#606c38', 
  },
  circleInactive: {
    backgroundColor: '#e9e5d3', 
  },
  line: {
    flex: 1,
    height: 2,
    marginBottom: 20, 
  },
  lineActive: {
    backgroundColor: '#606c38',
  },
  lineInactive: {
    backgroundColor: '#e9e5d3',
  },
  label: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
    color: '#283618',
  },
  textActive: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    color: '#fefae0',
  },
  textInactive: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
    color: '#606c38',
  },
});