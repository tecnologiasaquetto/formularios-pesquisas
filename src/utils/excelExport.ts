import type { ExcelCell, ExcelRow, ExcelSheet } from "@/types";

export class ExcelExporter {
  private sheets: ExcelSheet[] = [];
  
  addSheet(name: string, data: any[][], headers: string[] = []) {
    const rows: ExcelRow[] = [];
    
    // Add header row with styling
    if (headers.length > 0) {
      rows.push({
        cells: headers.map(header => ({
          value: header,
          type: 'string',
          style: { bold: true, bg: '#f3f4f6' }
        }))
      });
    }
    
    // Add data rows
    data.forEach(row => {
      rows.push({
        cells: row.map(cell => ({
          value: cell,
          type: typeof cell === 'number' ? 'number' : 'string'
        }))
      });
    });
    
    this.sheets.push({ name, rows });
  }
  
  export(): Blob {
    let csvContent = '';
    
    this.sheets.forEach((sheet, sheetIndex) => {
      if (sheetIndex > 0) {
        csvContent += '\n\n'; // Separate sheets with newlines
      }
      
      // Add sheet name as header
      csvContent += `${sheet.name}\n`;
      
      // Convert rows to CSV
      sheet.rows.forEach(row => {
        const csvRow = row.cells.map(cell => {
          const value = String(cell.value || '');
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csvContent += csvRow.join(',') + '\n';
      });
    });
    
    // Create blob with Excel-compatible content
    return new Blob(['\uFEFF' + csvContent], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;' 
    });
  }
  
  download(filename: string) {
    const blob = this.export();
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export function createExcelExporter() {
  return new ExcelExporter();
}
