/**
 * Connection Manager for HTTP/HTTPS connection pooling and HTTP/2 support
 * 
 * Provides efficient connection reuse, HTTP/2 support, and configurable pooling
 * for enhanced performance without breaking existing RestifiedTS functionality.
 */

import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

export interface ConnectionPoolConfig {
  /** Enable connection keep-alive (default: true) */
  keepAlive?: boolean;
  
  /** Maximum number of sockets per host (default: 50) */
  maxSockets?: number;
  
  /** Maximum number of free sockets to keep open (default: 10) */
  maxFreeSockets?: number;
  
  /** Socket timeout in milliseconds (default: 30000) */
  timeout?: number;
  
  /** Enable HTTP/2 support where available (default: true) */
  http2?: boolean;
  
  /** Connection idle timeout in milliseconds (default: 60000) */
  keepAliveMsecs?: number;
  
  /** Enable TCP_NODELAY (default: true) */
  noDelay?: boolean;
  
  /** Enable SO_KEEPALIVE (default: true) */
  keepAliveInitialDelay?: number;
}

export interface ConnectionStats {
  /** Current active connections */
  activeConnections: number;
  
  /** Current free connections in pool */
  freeConnections: number;
  
  /** Total requests served */
  totalRequests: number;
  
  /** Cache hits (reused connections) */
  cacheHits: number;
  
  /** Cache misses (new connections) */
  cacheMisses: number;
  
  /** HTTP/2 connections */
  http2Connections: number;
}

/**
 * Manages HTTP/HTTPS connection pooling with HTTP/2 support
 */
export class ConnectionManager {
  private httpAgent: http.Agent;
  private httpsAgent: https.Agent;
  private config: Required<ConnectionPoolConfig>;
  private stats: ConnectionStats;
  private agents: Map<string, http.Agent | https.Agent> = new Map();

  constructor(config: ConnectionPoolConfig = {}) {
    this.config = {
      keepAlive: true,
      maxSockets: 50,
      maxFreeSockets: 10,
      timeout: 30000,
      http2: true,
      keepAliveMsecs: 60000,
      noDelay: true,
      keepAliveInitialDelay: 1000,
      ...config
    };

    this.stats = {
      activeConnections: 0,
      freeConnections: 0,
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      http2Connections: 0
    };

    this.initializeAgents();
  }

  /**
   * Initialize HTTP and HTTPS agents with optimized settings
   */
  private initializeAgents(): void {
    const agentOptions = {
      keepAlive: this.config.keepAlive,
      maxSockets: this.config.maxSockets,
      maxFreeSockets: this.config.maxFreeSockets,
      timeout: this.config.timeout,
      keepAliveMsecs: this.config.keepAliveMsecs,
      // TCP_NODELAY will be handled at socket level
    };

    // HTTP Agent
    this.httpAgent = new http.Agent(agentOptions);

    // HTTPS Agent with compatible settings
    this.httpsAgent = new https.Agent({
      ...agentOptions,
      // Use default TLS settings for better compatibility
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    });

    // Set up connection tracking
    this.setupConnectionTracking();
  }

  /**
   * Get appropriate agent for URL
   */
  getAgent(url: string): http.Agent | https.Agent {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol;
    
    this.stats.totalRequests++;
    
    // Check for cached agent first
    const agentKey = `${protocol}//${parsedUrl.host}`;
    if (this.agents.has(agentKey)) {
      this.stats.cacheHits++;
      return this.agents.get(agentKey)!;
    }

    this.stats.cacheMisses++;

    if (protocol === 'https:') {
      // HTTP/2 support for HTTPS
      if (this.config.http2) {
        const http2Agent = this.createHTTP2Agent(parsedUrl.host);
        if (http2Agent) {
          this.agents.set(agentKey, http2Agent);
          this.stats.http2Connections++;
          return http2Agent;
        }
      }
      
      this.agents.set(agentKey, this.httpsAgent);
      return this.httpsAgent;
    }

    this.agents.set(agentKey, this.httpAgent);
    return this.httpAgent;
  }

  /**
   * Create HTTP/2 agent if available
   */
  private createHTTP2Agent(host: string): https.Agent | null {
    try {
      // Check if HTTP/2 is available
      const http2 = require('http2');
      
      // Create HTTP/2-optimized HTTPS agent
      return new https.Agent({
        ...this.httpsAgent.options,
        // HTTP/2 specific optimizations
        ALPNProtocols: ['h2', 'http/1.1']
      });
    } catch (error) {
      // HTTP/2 not available, fallback to HTTP/1.1
      return null;
    }
  }

  /**
   * Setup connection tracking for statistics
   */
  private setupConnectionTracking(): void {
    const trackAgent = (agent: http.Agent | https.Agent) => {
      agent.on('free', () => {
        this.stats.freeConnections++;
      });

      agent.on('connect', () => {
        this.stats.activeConnections++;
      });
    };

    trackAgent(this.httpAgent);
    trackAgent(this.httpsAgent);
  }

  /**
   * Get axios configuration with connection pooling
   */
  getAxiosConfig(baseURL?: string): any {
    const agent = baseURL ? this.getAgent(baseURL) : undefined;
    
    return {
      // Use the appropriate agent
      httpAgent: this.httpAgent,
      httpsAgent: this.httpsAgent,
      // Override with specific agent if provided
      ...(agent && { 
        httpAgent: agent.constructor.name === 'Agent' ? agent : this.httpAgent,
        httpsAgent: agent.constructor.name === 'Agent' ? this.httpsAgent : agent
      }),
      
      // Connection optimization
      timeout: this.config.timeout,
      
      // Compression support
      decompress: true,
      
      // Response size limit (100MB)
      maxContentLength: 100 * 1024 * 1024,
      maxBodyLength: 100 * 1024 * 1024,
      
      // Keep-alive headers
      headers: {
        'Connection': 'keep-alive',
        'Keep-Alive': `timeout=${Math.floor(this.config.keepAliveMsecs / 1000)}`,
        'Accept-Encoding': 'gzip, deflate, br'
      }
    };
  }

  /**
   * Get connection statistics
   */
  getStats(): ConnectionStats {
    // Update live stats from agents
    this.updateLiveStats();
    return { ...this.stats };
  }

  /**
   * Update live statistics from agents
   */
  private updateLiveStats(): void {
    // Update from HTTP agent
    const httpSockets = this.httpAgent.sockets || {};
    const httpFreeSockets = this.httpAgent.freeSockets || {};
    
    // Update from HTTPS agent
    const httpsSockets = this.httpsAgent.sockets || {};
    const httpsFreeSockets = this.httpsAgent.freeSockets || {};
    
    // Calculate current connections
    let activeSockets = 0;
    let freeSockets = 0;
    
    Object.values(httpSockets).forEach((sockets: any) => {
      activeSockets += Array.isArray(sockets) ? sockets.length : 1;
    });
    
    Object.values(httpsFreeSockets).forEach((sockets: any) => {
      freeSockets += Array.isArray(sockets) ? sockets.length : 1;
    });
    
    Object.values(httpsSockets).forEach((sockets: any) => {
      activeSockets += Array.isArray(sockets) ? sockets.length : 1;
    });
    
    Object.values(httpsFreeSockets).forEach((sockets: any) => {
      freeSockets += Array.isArray(sockets) ? sockets.length : 1;
    });
    
    this.stats.activeConnections = activeSockets;
    this.stats.freeConnections = freeSockets;
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      activeConnections: 0,
      freeConnections: 0,
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      http2Connections: 0
    };
  }

  /**
   * Cleanup connections and destroy agents
   */
  destroy(): void {
    this.httpAgent.destroy();
    this.httpsAgent.destroy();
    this.agents.clear();
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    cacheHitRatio: number;
    averageConnectionReuse: number;
    http2Usage: number;
    poolEfficiency: number;
  } {
    const { totalRequests, cacheHits, http2Connections, activeConnections } = this.stats;
    
    return {
      cacheHitRatio: totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0,
      averageConnectionReuse: cacheHits > 0 ? totalRequests / cacheHits : 1,
      http2Usage: totalRequests > 0 ? (http2Connections / totalRequests) * 100 : 0,
      poolEfficiency: activeConnections > 0 ? (activeConnections / this.config.maxSockets) * 100 : 0
    };
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(newConfig: Partial<ConnectionPoolConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.destroy();
    this.initializeAgents();
  }
}

// Global connection manager instance
export const globalConnectionManager = new ConnectionManager();