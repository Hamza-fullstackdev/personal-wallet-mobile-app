import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { config } from '../../config';
import { http, type QueryParams } from './client';
import type { StatementData } from '../../types';

export interface StatementQuery extends QueryParams {
  startDate?: string;
  endDate?: string;
  category?: string;
  type?: string;
  person?: string;
}

/** GET /api/user/bank-statement/data */
export async function getStatementData(query: StatementQuery = {}): Promise<StatementData> {
  const response = await http.get<StatementData>(config.api.statementData, { params: query });
  return response.data;
}

function buildPdfFilename(query: StatementQuery): string {
  const person = query.person && query.person !== 'all' ? `-${query.person}` : '';
  const start = query.startDate || 'all';
  const end = query.endDate || 'today';
  return `bank-statement${person}-${start}-to-${end}.pdf`;
}

/**
 * GET /api/user/bank-statement/pdf
 * Downloads the PDF binary and opens the native share sheet.
 * Returns the local file URI so the screen can show a confirmation.
 */
export async function downloadStatementPdf(query: StatementQuery = {}): Promise<string> {
  const response = await http.get(config.api.statementPdf, {
    params: query,
    responseType: 'arraybuffer',
    // PDF generation is slower than the default API timeout.
    timeout: 60_000,
  });

  const filename = buildPdfFilename(query);
  const file = new File(Paths.cache, filename);

  file.create({ overwrite: true });
  file.write(new Uint8Array(response.data as ArrayBuffer));

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Bank Statement',
      UTI: 'com.adobe.pdf',
    });
  }

  return file.uri;
}
