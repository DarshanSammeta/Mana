import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 12, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  logo: { width: 120 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2563EB' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 5, color: '#2563EB' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  table: { marginTop: 20 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: 8, fontWeight: 'bold', color: '#475569' },
  tableRow: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', color: '#1e293b' },
  col1: { flex: 2 },
  col2: { flex: 1, textAlign: 'right' },
  footer: { marginTop: 50, textAlign: 'center', color: '#94a3b8', fontSize: 10 },
  totalSection: { marginTop: 20, alignSelf: 'flex-end', width: 200 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, color: '#475569' },
  grandTotal: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 }
});

interface InvoiceProps {
  data: any;
}

export const InvoiceTemplate = ({ data }: InvoiceProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>INVOICE</Text>
          <Text>#{data.invoiceNumber}</Text>
          <Text>Date: {new Date(data.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={{ textAlign: 'right' }}>
          <Text style={{ fontWeight: 'bold' }}>MANA EVENTS</Text>
          <Text>Bangalore, Karnataka</Text>
          <Text>GSTIN: 29AAAAA0000A1Z5</Text>
        </View>
      </View>

      {/* Bill To / From */}
      <View style={{ flexDirection: 'row', gap: 40 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Billed To</Text>
          <Text style={{ fontWeight: 'bold' }}>{data.customerName}</Text>
          <Text>{data.customerEmail}</Text>
          <Text>{data.customerPhone}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Vendor</Text>
          <Text style={{ fontWeight: 'bold' }}>{data.vendorName}</Text>
          <Text>{data.vendorCity}, {data.vendorState}</Text>
          {data.vendorGst && <Text>GST: {data.vendorGst}</Text>}
        </View>
      </View>

      {/* Event Details */}
      <View style={styles.table}>
        <Text style={styles.sectionTitle}>Booking Details</Text>
        <Text>Event: {data.eventName} ({data.eventType})</Text>
        <Text>Location: {data.eventLocation}</Text>
        <Text>Date: {new Date(data.eventDate).toLocaleDateString()}</Text>
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>Service / Package</Text>
          <Text style={styles.col2}>Amount</Text>
        </View>
        {data.items.map((item: any, i: number) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.col1}>{item.serviceName} - {item.packageName || 'Standard'}</Text>
            <Text style={styles.col2}>₹{item.price}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totalSection}>
        <View style={styles.totalRow}>
          <Text>Subtotal</Text>
          <Text>₹{data.subTotal}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text>Tax (18% GST)</Text>
          <Text>₹{data.taxAmount}</Text>
        </View>
        {data.discountAmount > 0 && (
          <View style={styles.totalRow}>
            <Text>Discount</Text>
            <Text>- ₹{data.discountAmount}</Text>
          </View>
        )}
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text>Total</Text>
          <Text>₹{data.totalAmount}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Thank you for choosing Mana Events.</Text>
        <Text>This is a computer-generated invoice and does not require a physical signature.</Text>
      </View>
    </Page>
  </Document>
);
