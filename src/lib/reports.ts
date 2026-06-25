import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

export async function generateEarningsPDF(vendorName: string, transactions: any[]) {
  const doc = new jsPDF() as any;

  doc.text(`Earnings Report: ${vendorName}`, 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

  const tableColumn = ["Date", "Description", "Type", "Amount"];
  const tableRows: any[] = [];

  transactions.forEach((tx) => {
    const txData = [
      new Date(tx.createdAt).toLocaleDateString(),
      tx.description,
      tx.type,
      `INR ${Number(tx.amount).toFixed(2)}`,
    ];
    tableRows.push(txData);
  });

  doc.autoTable(tableColumn, tableRows, { startY: 30 });
  return doc.output("blob");
}

export async function generateEarningsExcel(vendorName: string, transactions: any[]) {
  const worksheet = XLSX.utils.json_to_sheet(
    transactions.map((tx) => ({
      Date: new Date(tx.createdAt).toLocaleDateString(),
      Description: tx.description,
      Type: tx.type,
      Amount: Number(tx.amount).toFixed(2),
      Status: tx.status
    }))
  );
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Earnings");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export async function generateEarningsCSV(transactions: any[]) {
  const worksheet = XLSX.utils.json_to_sheet(
    transactions.map((tx) => ({
      Date: new Date(tx.createdAt).toLocaleDateString(),
      Description: tx.description,
      Type: tx.type,
      Amount: Number(tx.amount).toFixed(2),
      Status: tx.status
    }))
  );
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  return new Blob([csv], { type: "text/csv;charset=utf-8;" });
}
