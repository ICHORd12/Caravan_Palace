import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  invoicePaper: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  invoiceTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 36,
    color: '#283618',
    letterSpacing: 2,
  },
  invoiceNumber: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
    color: '#606c38',
    marginTop: 4,
  },
  sellerDetails: {
    alignItems: 'flex-end',
  },
  sellerName: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
    color: '#283618',
  },
  sellerText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    color: '#606c38',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#e9e5d3',
    marginVertical: 20,
  },
  billingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  sectionHeader: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    color: '#606c38',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  addressText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
    color: '#283618',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#fefae0',
    padding: 12,
    borderRadius: 4,
    marginBottom: 10,
  },
  tableHeaderText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    color: '#283618',
  },
  listContainer: {
    flexGrow: 0,
  },
  invoiceRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fefae0',
    alignItems: 'center',
  },
  invoiceItemInfo: {
    flex: 2,
  },
  itemName: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
    color: '#283618',
  },
  itemIdText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    color: '#606c38',
    marginTop: 2,
  },
  invoiceText: {
    flex: 1,
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
    color: '#283618',
    textAlign: 'center',
  },
  rowTotal: {
    fontFamily: 'Montserrat_700Bold',
    textAlign: 'right',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
  },
  totalLabel: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 20,
    color: '#606c38',
    marginRight: 20,
  },
  totalValue: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 24,
    color: '#bc4749',
  }
});