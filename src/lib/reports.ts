import { formatSafe } from "./utils/date";

export async function generateEarningsPDF(vendorName: string, transactions: any[]) {
  // Dynamic imports for heavy libraries
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF() as any;

  doc.text(`Earnings Report: ${vendorName}`, 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated on: ${formatSafe(new Date(), "dd/MM/yyyy")}`, 14, 22);

  const tableColumn = ["Date", "Description", "Type", "Amount"];
  const tableRows: any[] = [];

  transactions.forEach((tx) => {
    const txData = [
      formatSafe(tx.createdAt, "dd/MM/yyyy"),
      tx.description,
      tx.type,
      `INR ${Number(tx.amount).toFixed(2)}`,
    ];
    tableRows.push(txData);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 30,
  });

  return doc.output("blob");
}

export async function generateEarningsExcel(_vendorName: string, transactions: any[]) {
  // Dynamic import for XLSX
  const XLSX = await import("xlsx");

  const worksheet = XLSX.utils.json_to_sheet(
    transactions.map((tx) => ({
      Date: formatSafe(tx.createdAt, "dd/MM/yyyy"),
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
  const XLSX = await import("xlsx");

  const worksheet = XLSX.utils.json_to_sheet(
    transactions.map((tx) => ({
      Date: formatSafe(tx.createdAt, "dd/MM/yyyy"),
      Description: tx.description,
      Type: tx.type,
      Amount: Number(tx.amount).toFixed(2),
      Status: tx.status
    }))
  );
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  return new Blob([csv], { type: "text/csv;charset=utf-8;" });
}
