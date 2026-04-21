import { View, Text } from "react-native";
import {styles} from './PaymentView.styles'

function PaymentView()
{
    return(
        <View style={styles.mainContainer}>
            <Text>PaymentView</Text>
        </View>
    )
}


export default PaymentView;



/*
Payment 
    Name on Card (Often required by banks to match the card, even if you already have their Full Name)

    Card Number

    Expiration Date (MM/YY)

    CVV
Personal Information
    Email (Non-modifiable, pulled from auth)

    Full Name (Non-modifiable, pulled from auth)

    Phone Number (Crucial for high-value deliveries like caravans!)

Address
    Street Address

    City

    State / Province

    ZIP / Postal Code

    Country

    Checkbox: 
Tax
    Auto





*/