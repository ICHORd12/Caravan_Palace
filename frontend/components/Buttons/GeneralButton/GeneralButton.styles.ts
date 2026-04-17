import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  GeneralButton: {
    fontFamily: 'Montserrat_600SemiBold', 
    fontSize: 15,                     
    textAlign: 'center',              
    color: '#222222',
  },
  GeneralButtonHovered: {
    textDecorationLine: 'underline', 
  },
  GeneralButtonDisabled: {
    opacity: 0.5
  }
});