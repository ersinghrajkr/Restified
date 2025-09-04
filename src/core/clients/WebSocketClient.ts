/**
 * WebSocket Client for RestifiedTS
 * 
 * Provides comprehensive WebSocket testing capabilities for real-time applications
 */

import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { VariableStore } from '../stores/variable.core';

export interface WebSocketMessage {
  type?: string;
  data?: any;
  timestamp?: number;
  id?: string;
}

export interface WebSocketClientConfig {
  url: string;
  protocols?: string | string[];
  headers?: Record<string, string>;
  timeout?: number;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  pingInterval?: number;
  pongTimeout?: number;
}

export interface WebSocketTestResult {
  connected: boolean;
  messages: WebSocketMessage[];
  connectionTime: number;
  disconnectionTime?: number;
  errors: string[];
  pingLatency?: number;
}

export class WebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: WebSocketClientConfig;
  private variableStore: VariableStore;
  private messages: WebSocketMessage[] = [];
  private errors: string[] = [];
  private connectionTime: number = 0;
  private disconnectionTime?: number;
  private reconnectTimer?: NodeJS.Timeout;
  private pingTimer?: NodeJS.Timeout;
  private pongTimer?: NodeJS.Timeout;
  private reconnectAttempts: number = 0;
  private isManualDisconnect: boolean = false;

  constructor(config: WebSocketClientConfig, variableStore: VariableStore) {
    super();
    this.config = config;
    this.variableStore = variableStore;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const resolvedUrl = this.variableStore.resolveVariables(this.config.url);
        
        this.ws = new WebSocket(resolvedUrl, this.config.protocols, {
          headers: this.config.headers,
          handshakeTimeout: this.config.timeout || 10000
        });

        this.connectionTime = Date.now();

        this.ws.on('open', () => {
          this.emit('connected');
          this.setupPingPong();
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          const message: WebSocketMessage = {
            data: this.parseMessage(data),
            timestamp: Date.now(),
            id: this.generateMessageId()
          };
          
          this.messages.push(message);
          this.emit('message', message);
        });

        this.ws.on('error', (error: Error) => {
          this.errors.push(error.message);
          this.emit('error', error);
          reject(error);
        });

        this.ws.on('close', (code: number, reason: string) => {
          this.disconnectionTime = Date.now();
          this.cleanup();
          this.emit('disconnected', { code, reason });

          // Auto-reconnect if not manual disconnect
          if (!this.isManualDisconnect && this.shouldReconnect()) {
            this.scheduleReconnect();
          }
        });

        this.ws.on('ping', (data: Buffer) => {
          this.emit('ping', data);
        });

        this.ws.on('pong', (data: Buffer) => {
          this.emit('pong', data);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      this.isManualDisconnect = true;
      this.cleanup();

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.once('close', () => resolve());
        this.ws.close(1000, 'Manual disconnect');
      } else {
        resolve();
      }
    });
  }

  /**
   * Send message to WebSocket server
   */
  async send(data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'));
        return;
      }

      try {
        let message: string;
        
        if (typeof data === 'string') {
          message = this.variableStore.resolveVariables(data) as string;
        } else {
          // Resolve variables in the object, then stringify
          const resolvedData = this.variableStore.resolveVariables(data);
          message = JSON.stringify(resolvedData);
        }

        this.ws.send(message, (error) => {
          if (error) {
            this.errors.push(error.message);
            reject(error);
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send JSON message
   */
  async sendJSON(data: any): Promise<void> {
    const resolvedData = this.variableStore.resolveVariables(data);
    return this.send(resolvedData);
  }

  /**
   * Wait for specific message
   */
  async waitForMessage(
    predicate: (message: WebSocketMessage) => boolean,
    timeout: number = 5000
  ): Promise<WebSocketMessage> {
    return new Promise((resolve, reject) => {
      // Check existing messages first
      const existingMessage = this.messages.find(predicate);
      if (existingMessage) {
        resolve(existingMessage);
        return;
      }

      // Set up timeout
      const timer = setTimeout(() => {
        this.removeListener('message', messageHandler);
        reject(new Error(`Timeout waiting for message after ${timeout}ms`));
      }, timeout);

      // Listen for new messages
      const messageHandler = (message: WebSocketMessage) => {
        if (predicate(message)) {
          clearTimeout(timer);
          this.removeListener('message', messageHandler);
          resolve(message);
        }
      };

      this.on('message', messageHandler);
    });
  }

  /**
   * Wait for connection
   */
  async waitForConnection(timeout: number = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected()) {
        resolve();
        return;
      }

      const timer = setTimeout(() => {
        this.removeListener('connected', connectHandler);
        reject(new Error(`Connection timeout after ${timeout}ms`));
      }, timeout);

      const connectHandler = () => {
        clearTimeout(timer);
        this.removeListener('connected', connectHandler);
        resolve();
      };

      this.once('connected', connectHandler);
    });
  }

  /**
   * Ping the server
   */
  async ping(data?: Buffer): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'));
        return;
      }

      const startTime = Date.now();

      const pongHandler = () => {
        const latency = Date.now() - startTime;
        this.removeListener('pong', pongHandler);
        resolve(latency);
      };

      this.once('pong', pongHandler);

      // Timeout for pong response
      setTimeout(() => {
        this.removeListener('pong', pongHandler);
        reject(new Error('Ping timeout'));
      }, this.config.pongTimeout || 5000);

      this.ws.ping(data);
    });
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get all received messages
   */
  getMessages(): WebSocketMessage[] {
    return [...this.messages];
  }

  /**
   * Get messages matching predicate
   */
  getMessagesWhere(predicate: (message: WebSocketMessage) => boolean): WebSocketMessage[] {
    return this.messages.filter(predicate);
  }

  /**
   * Clear message history
   */
  clearMessages(): void {
    this.messages = [];
  }

  /**
   * Get test results
   */
  getTestResult(): WebSocketTestResult {
    return {
      connected: this.isConnected(),
      messages: this.getMessages(),
      connectionTime: this.connectionTime,
      disconnectionTime: this.disconnectionTime,
      errors: [...this.errors],
      pingLatency: undefined // Will be set by ping method
    };
  }

  /**
   * Parse incoming message
   */
  private parseMessage(data: WebSocket.Data): any {
    try {
      const message = data.toString();
      return JSON.parse(message);
    } catch {
      return data.toString();
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Setup ping/pong for connection health
   */
  private setupPingPong(): void {
    if (this.config.pingInterval) {
      this.pingTimer = setInterval(() => {
        if (this.isConnected()) {
          this.ping().catch(() => {
            // Ping failed, connection might be dead
            this.errors.push('Ping failed - connection may be lost');
          });
        }
      }, this.config.pingInterval);
    }
  }

  /**
   * Check if should attempt reconnection
   */
  private shouldReconnect(): boolean {
    return this.reconnectAttempts < (this.config.reconnectAttempts || 3);
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    const delay = this.config.reconnectDelay || 1000;
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.emit('reconnecting', this.reconnectAttempts);
      
      this.connect().catch((error) => {
        this.emit('reconnectFailed', error);
        
        if (this.shouldReconnect()) {
          this.scheduleReconnect();
        }
      });
    }, delay);
  }

  /**
   * Cleanup timers and listeners
   */
  private cleanup(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = undefined;
    }

    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = undefined;
    }
  }
}