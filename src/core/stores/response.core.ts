import { HttpResponse } from '../../RestifiedTypes';

export class ResponseStore {
  private responses: Map<string, HttpResponse> = new Map();
  private currentResponse: HttpResponse | null = null;
  private responseHistory: HttpResponse[] = [];

  setCurrentResponse(response: HttpResponse): void {
    this.currentResponse = response;
    this.responseHistory.push(response);
  }

  getCurrentResponse(): HttpResponse | null {
    return this.currentResponse;
  }

  storeResponse(key: string, response: HttpResponse): void {
    this.responses.set(key, response);
  }

  getStoredResponse(key: string): HttpResponse | null {
    return this.responses.get(key) || null;
  }

  hasStoredResponse(key: string): boolean {
    return this.responses.has(key);
  }

  getAllStoredResponses(): Map<string, HttpResponse> {
    return new Map(this.responses);
  }

  getResponseHistory(): HttpResponse[] {
    return [...this.responseHistory];
  }

  getLastResponse(): HttpResponse | null {
    return this.responseHistory.length > 0 
      ? this.responseHistory[this.responseHistory.length - 1]
      : null;
  }

  getResponseByIndex(index: number): HttpResponse | null {
    return this.responseHistory[index] || null;
  }

  clearStoredResponses(): void {
    this.responses.clear();
  }

  clearResponseHistory(): void {
    this.responseHistory = [];
    this.currentResponse = null;
  }

  clearAll(): void {
    this.clearStoredResponses();
    this.clearResponseHistory();
  }

  getResponseCount(): number {
    return this.responseHistory.length;
  }

  getStoredResponseCount(): number {
    return this.responses.size;
  }

  removeStoredResponse(key: string): boolean {
    return this.responses.delete(key);
  }

  dumpResponses(): void {
    console.log('=== Response Store Dump ===');
    console.log('Current Response:', this.currentResponse ? 'Present' : 'None');
    console.log('Stored Responses:', this.responses.size);
    console.log('Response History:', this.responseHistory.length);
    
    this.responses.forEach((response, key) => {
      console.log(`  ${key}: ${response.status} ${response.statusText}`);
    });
    
    console.log('==========================');
  }
}