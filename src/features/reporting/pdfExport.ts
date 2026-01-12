import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Entry, PageMetrics } from '../../types/models';

interface ReportData {
  month: string;
  monthLabel: string;
  totalEntries: number;
  publishedEntries: number;
  platformBreakdown: { platform: string; count: number; engagementTotal: number }[];
  assetTypeBreakdown: { type: string; count: number }[];
  topEntries: Entry[];
  pageMetrics: PageMetrics[];
  totalEngagement: number;
  avgEngagement: number;
  executiveSummary?: string;
}

// Population Matters brand colors
const COLORS = {
  ocean: [17, 96, 125] as [number, number, number], // #11607d
  oceanLight: [191, 236, 246] as [number, number, number], // #bfecf6
  graystone: [107, 114, 128] as [number, number, number], // #6b7280
  white: [255, 255, 255] as [number, number, number],
};

/**
 * Generate a PDF report from monthly report data
 */
export function generateReportPDF(data: ReportData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Helper to add section header
  const addSectionHeader = (title: string) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFillColor(...COLORS.ocean);
    doc.rect(14, yPos - 2, pageWidth - 28, 8, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 16, yPos + 4);
    doc.setTextColor(0, 0, 0);
    yPos += 14;
  };

  // Title
  doc.setFillColor(...COLORS.ocean);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Monthly Performance Report', pageWidth / 2, 18, { align: 'center' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(data.monthLabel, pageWidth / 2, 28, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPos = 50;

  // Executive Summary (if provided)
  if (data.executiveSummary) {
    addSectionHeader('Executive Summary');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(data.executiveSummary, pageWidth - 30);
    doc.text(lines, 16, yPos);
    yPos += lines.length * 5 + 10;
  }

  // Key Metrics
  addSectionHeader('Key Metrics');
  const metricsData = [
    ['Total Entries', data.totalEntries.toString()],
    ['Published', data.publishedEntries.toString()],
    ['Total Engagement', data.totalEngagement.toLocaleString()],
    ['Avg. Engagement', Math.round(data.avgEngagement).toLocaleString()],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: metricsData,
    theme: 'striped',
    headStyles: { fillColor: COLORS.ocean, textColor: COLORS.white },
    margin: { left: 14, right: 14 },
    tableWidth: 'auto',
  });
  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Platform Breakdown
  if (data.platformBreakdown.length > 0) {
    addSectionHeader('Platform Breakdown');
    const platformData = data.platformBreakdown.map((pb) => [
      pb.platform,
      pb.count.toString(),
      pb.engagementTotal.toLocaleString(),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Platform', 'Posts', 'Engagement']],
      body: platformData,
      theme: 'striped',
      headStyles: { fillColor: COLORS.ocean, textColor: COLORS.white },
      margin: { left: 14, right: 14 },
    });
    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Content Types
  if (data.assetTypeBreakdown.length > 0) {
    addSectionHeader('Content Types');
    const assetData = data.assetTypeBreakdown.map((ab) => [ab.type, ab.count.toString()]);

    autoTable(doc, {
      startY: yPos,
      head: [['Type', 'Count']],
      body: assetData,
      theme: 'striped',
      headStyles: { fillColor: COLORS.ocean, textColor: COLORS.white },
      margin: { left: 14, right: 14 },
      tableWidth: 'auto',
    });
    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Page Metrics
  if (data.pageMetrics.length > 0) {
    addSectionHeader('Page Metrics');
    const pageData = data.pageMetrics.map((pm) => [
      pm.platform,
      pm.followers.toLocaleString(),
      (pm.followersChange > 0 ? '+' : '') + pm.followersChange.toLocaleString(),
      pm.reach > 0 ? pm.reach.toLocaleString() : '-',
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Platform', 'Followers', 'Change', 'Reach']],
      body: pageData,
      theme: 'striped',
      headStyles: { fillColor: COLORS.ocean, textColor: COLORS.white },
      margin: { left: 14, right: 14 },
    });
    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Top Performers
  if (data.topEntries.length > 0) {
    addSectionHeader('Top Performing Posts');
    const topData = data.topEntries.map((entry, idx) => {
      const caption = entry.caption || 'Untitled';
      const truncated = caption.length > 50 ? caption.slice(0, 47) + '...' : caption;
      return [(idx + 1).toString(), entry.platforms.join(', '), truncated, entry.date];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Platforms', 'Caption', 'Date']],
      body: topData,
      theme: 'striped',
      headStyles: { fillColor: COLORS.ocean, textColor: COLORS.white },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 30 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 25 },
      },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.graystone);
    doc.text(
      `Generated ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' },
    );
    doc.text('Population Matters', pageWidth - 14, doc.internal.pageSize.getHeight() - 10, {
      align: 'right',
    });
  }

  return doc;
}

/**
 * Generate and download a PDF report
 */
export function downloadReportPDF(data: ReportData): void {
  const doc = generateReportPDF(data);
  const filename = `pm-report-${data.month}.pdf`;
  doc.save(filename);
}
