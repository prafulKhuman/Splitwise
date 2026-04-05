import { Transaction, GroupTransaction } from "./types";
import { formatCurrency } from "./settlements";

export function exportTransactionsCSV(transactions: Transaction[], filename = "transactions.csv") {
  const headers = ["Date", "Title", "Type", "Category", "Amount", "Notes"];
  const rows = transactions.map((t) => [
    t.date,
    `"${t.title.replace(/"/g, '""')}"`,
    t.type,
    t.category,
    t.amount.toFixed(2),
    `"${(t.notes || "").replace(/"/g, '""')}"`,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  downloadFile(csv, filename, "text/csv");
}

export function exportGroupTransactionsCSV(transactions: GroupTransaction[], filename = "group-transactions.csv") {
  const headers = ["Date", "Title", "Amount", "Paid By", "Split Method", "Category", "Notes"];
  const rows = transactions.map((t) => [
    t.date,
    `"${t.title.replace(/"/g, '""')}"`,
    t.amount.toFixed(2),
    `"${t.paid_by_name}"`,
    t.split_method,
    t.category,
    `"${(t.notes || "").replace(/"/g, '""')}"`,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  downloadFile(csv, filename, "text/csv");
}

export function exportTransactionsPDF(transactions: Transaction[], title = "Transactions Report") {
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type !== "income").reduce((s, t) => s + t.amount, 0);

  const tableRows = transactions.map((t) =>
    `<tr>
      <td style="padding:6px 10px;border-bottom:1px solid #eee">${t.date}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee">${t.title}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;color:${t.type === "income" ? "#1DC9B7" : "#FD397A"}">${t.type === "income" ? "+" : "-"}${formatCurrency(t.amount)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee">${t.category}</td>
    </tr>`
  ).join("");

  const html = `
    <html><head><title>${title}</title>
    <style>body{font-family:Inter,sans-serif;padding:30px;color:#3F4254}
    h1{color:#6C63FF;margin-bottom:5px}table{width:100%;border-collapse:collapse;margin-top:20px}
    th{background:#6C63FF;color:#fff;padding:8px 10px;text-align:left}
    .summary{display:flex;gap:20px;margin:15px 0}.card{padding:12px 20px;border-radius:8px;flex:1}
    </style></head><body>
    <h1>${title}</h1>
    <p style="color:#B5B5C3">Generated on ${new Date().toLocaleDateString()}</p>
    <div class="summary">
      <div class="card" style="background:#1DC9B715"><b>Income:</b> ${formatCurrency(totalIncome)}</div>
      <div class="card" style="background:#FD397A15"><b>Expenses:</b> ${formatCurrency(totalExpense)}</div>
      <div class="card" style="background:#6C63FF15"><b>Net:</b> ${formatCurrency(totalIncome - totalExpense)}</div>
    </div>
    <table><thead><tr><th>Date</th><th>Title</th><th>Amount</th><th>Category</th></tr></thead>
    <tbody>${tableRows}</tbody></table>
    <p style="margin-top:20px;color:#B5B5C3;font-size:12px">Total: ${transactions.length} transactions</p>
    </body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
  }
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type: `${type};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
