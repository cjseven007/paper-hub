import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface ParsedEquation {
  latex: string;
  description?: string;
}

export interface ParsedFigure {
  label: string;
  description: string;
}

export interface ParsedSubQuestion {
  sub_number: string;
  text: string;
  marks?: number | null;
  figures?: ParsedFigure[];
  equations?: ParsedEquation[];
}

export interface ParsedQuestion {
  question_number: string;
  text: string;
  marks?: number | null;
  sub_questions?: ParsedSubQuestion[];
  figures?: ParsedFigure[];
  equations?: ParsedEquation[];
}

// IMPORTANT: updated to match what the Cloud Function returns
export interface ParsedPaper {
  // legacy field (keep for backward compatibility if some older responses still have it)
  paper_title?: string;

  // new fields from Gemini / Cloud Function
  course_code?: string;
  course_name?: string;
  exam_date?: string; // e.g. "2024-06-23" or ""
  exam_year?: string; // e.g. "2024" or ""

  questions: ParsedQuestion[];
}

@Injectable({ providedIn: 'root' })
export class PaperParserService {
  private http = inject(HttpClient);

  // TODO: put your deployed function URL here
  private endpoint =
    'https://us-central1-paperhub-c66ab.cloudfunctions.net/parseExamPaper';

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        const result = reader.result as string;
        // result like "data:application/pdf;base64,AAAA..."
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.readAsDataURL(file);
    });
  }

  async parseExamPdf(file: File): Promise<ParsedPaper> {
    const fileBase64 = await this.fileToBase64(file);

    const response$ = this.http.post<ParsedPaper>(this.endpoint, {
      fileBase64,
    });

    return await firstValueFrom(response$);
  }
}
