import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Define your shop details here or import them
const shopDetails = {
  name: "THARAYIL BHARATGAS",
  address: "Palakkad - Kozhikode Hwy, Makkaraparamba, Kerala 676507",
  phone: "+91 9605111444",
  DISTRIBUTORCODE: "183041",
  gst: "32AALFT3265D1ZC",
  footerNote: "Billed by Neuraq Portal"
};

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 10,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    borderBottom: '1pt solid #000',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '40%',
    fontWeight: 'bold',
  },
  value: {
    width: '60%',
  },
  footer: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 10,
  },
});

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

const SaleReceiptPDF = ({ sale }) => (
  <Document>
    <Page style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{shopDetails.name}</Text>
        <Text style={styles.subtitle}>{shopDetails.address}</Text>
        <Text style={styles.subtitle}>DISTRIBUTOR CODE{shopDetails.DISTRIBUTORCODE}</Text>
        <Text>Phone: {shopDetails.phone} | GST: {shopDetails.gst}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sale Receipt</Text>
        <Text>Receipt No: {sale.id}</Text>
        <Text>Date: {format(sale.date, 'dd MMM yyyy')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{sale.customerName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{sale.customerPhone}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>{sale.customerAddress || sale.customerData?.address}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Product Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Product:</Text>
          <Text style={styles.value}>{sale.productName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Price:</Text>
          <Text style={styles.value}>{sale.productPrice}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Quantity:</Text>
          <Text style={styles.value}>{sale.salesQuantity}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Empty Cylinders:</Text>
          <Text style={styles.value}>{sale.emptyQuantity}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Total Amount:</Text>
          <Text style={styles.value}>{sale.todayCredit}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Amount Paid:</Text>
          <Text style={styles.value}>{sale.totalAmountReceived}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Balance:</Text>
          <Text style={styles.value}>{sale.totalBalance}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text>Thank you for your business!</Text>
        <Text>{shopDetails.footerNote}</Text>
      </View>
    </Page>
  </Document>
);

export default SaleReceiptPDF;