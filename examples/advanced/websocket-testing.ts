/**
 * WebSocket Testing Examples with RestifiedTS
 * 
 * Demonstrates comprehensive WebSocket real-time testing
 */

import { restified } from 'restifiedts';
import { expect } from 'chai';

describe('WebSocket Real-time Testing', function() {
  this.timeout(60000);

  before(async function() {
    // Create WebSocket client for echo service
    restified.createWebSocketClient('echo', {
      url: 'wss://echo.websocket.org',
      timeout: 10000,
      reconnectAttempts: 3,
      reconnectDelay: 1000,
      pingInterval: 30000
    });

    // Create WebSocket client for crypto data (if available)
    restified.createWebSocketClient('crypto', {
      url: 'wss://stream.binance.com:9443/ws/btcusdt@ticker',
      timeout: 10000,
      reconnectAttempts: 2
    });
  });

  afterAll(async function() {
    await restified.cleanup();
  });

  describe('WebSocket Connection Management', function() {
    it('should connect to WebSocket server', async function() {
      await restified.connectWebSocket('echo');
      
      const client = restified.getWebSocketClient('echo');
      expect(client.isConnected()).to.be.true;
    });

    it('should handle connection timeout', async function() {
      // Create client with very short timeout
      restified.createWebSocketClient('timeout-test', {
        url: 'wss://invalid-websocket-server.example.com',
        timeout: 1000
      });

      try {
        await restified.connectWebSocket('timeout-test');
        expect.fail('Should have thrown timeout error');
      } catch (error: any) {
        expect(error.message).to.include('timeout');
      }
    });
  });

  describe('Message Communication', function() {
    it('should send and receive text messages', async function() {
      const client = restified.getWebSocketClient('echo');
      
      // Clear any existing messages
      client.clearMessages();
      
      const testMessage = 'Hello WebSocket from RestifiedTS!';
      await client.send(testMessage);

      // Wait for echo response
      const receivedMessage = await client.waitForMessage(
        (msg) => msg.data === testMessage,
        5000
      );

      expect(receivedMessage.data).to.equal(testMessage);
      expect(receivedMessage.timestamp).to.be.a('number');
      expect(receivedMessage.id).to.be.a('string');
    });

    it('should send and receive JSON messages', async function() {
      const client = restified.getWebSocketClient('echo');
      
      client.clearMessages();
      
      const jsonMessage = {
        type: 'test',
        data: {
          userId: '{{$random.uuid}}',
          timestamp: '{{$date.now}}',
          message: 'JSON test from RestifiedTS'
        }
      };

      await client.sendJSON(jsonMessage);

      // Wait for JSON echo response
      const receivedMessage = await client.waitForMessage(
        (msg) => msg.data && msg.data.type === 'test',
        5000
      );

      expect(receivedMessage.data.type).to.equal('test');
      expect(receivedMessage.data.data.message).to.equal('JSON test from RestifiedTS');
      expect(receivedMessage.data.data.userId).to.match(/^[0-9a-f-]+$/);
    });

    it('should handle message with variables', async function() {
      const client = restified.getWebSocketClient('echo');
      
      restified.setGlobalVariable('userName', 'RestifiedTester');
      restified.setGlobalVariable('sessionId', 'session-12345');
      
      client.clearMessages();
      
      const messageWithVars = {
        user: '{{userName}}',
        session: '{{sessionId}}',
        action: 'ping',
        timestamp: Date.now()
      };

      await client.sendJSON(messageWithVars);

      const receivedMessage = await client.waitForMessage(
        (msg) => msg.data && msg.data.user === 'RestifiedTester',
        5000
      );

      expect(receivedMessage.data.user).to.equal('RestifiedTester');
      expect(receivedMessage.data.session).to.equal('session-12345');
      expect(receivedMessage.data.action).to.equal('ping');
    });
  });

  describe('Message Filtering and Querying', function() {
    it('should filter messages by criteria', async function() {
      const client = restified.getWebSocketClient('echo');
      
      client.clearMessages();
      
      // Send multiple messages
      await client.sendJSON({ type: 'order', id: 1, status: 'pending' });
      await client.sendJSON({ type: 'order', id: 2, status: 'completed' });
      await client.sendJSON({ type: 'notification', message: 'System update' });
      
      // Wait a bit for all messages to be received
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const orderMessages = client.getMessagesWhere(
        (msg) => msg.data && msg.data.type === 'order'
      );
      
      expect(orderMessages).to.have.length(2);
      
      const completedOrders = client.getMessagesWhere(
        (msg) => msg.data && msg.data.type === 'order' && msg.data.status === 'completed'
      );
      
      expect(completedOrders).to.have.length(1);
      expect(completedOrders[0].data.id).to.equal(2);
    });

    it('should wait for specific message patterns', async function() {
      const client = restified.getWebSocketClient('echo');
      
      client.clearMessages();
      
      // Send message that will trigger wait condition
      setTimeout(async () => {
        await client.sendJSON({ 
          type: 'response', 
          requestId: 'req-123',
          result: 'success' 
        });
      }, 1000);

      // Wait for specific response
      const response = await client.waitForMessage(
        (msg) => msg.data && 
                msg.data.type === 'response' && 
                msg.data.requestId === 'req-123',
        5000
      );

      expect(response.data.result).to.equal('success');
    });
  });

  describe('Connection Health and Ping', function() {
    it('should measure ping latency', async function() {
      const client = restified.getWebSocketClient('echo');
      
      if (client.isConnected()) {
        const latency = await client.ping();
        expect(latency).to.be.a('number');
        expect(latency).to.be.greaterThan(0);
        expect(latency).to.be.lessThan(10000); // Less than 10 seconds
        
        console.log(`WebSocket ping latency: ${latency}ms`);
      }
    });
  });

  describe('Real-time Data Stream Testing', function() {
    it('should receive crypto price updates', async function() {
      try {
        await restified.connectWebSocket('crypto');
        const client = restified.getWebSocketClient('crypto');
        
        client.clearMessages();
        
        // Wait for price update message
        const priceUpdate = await client.waitForMessage(
          (msg) => msg.data && typeof msg.data.c !== 'undefined', // 'c' is close price
          10000
        );

        expect(priceUpdate.data).to.have.property('s'); // symbol
        expect(priceUpdate.data).to.have.property('c'); // close price
        expect(priceUpdate.data.s).to.equal('BTCUSDT');
        expect(parseFloat(priceUpdate.data.c)).to.be.greaterThan(0);
        
        console.log(`Received BTC price: $${priceUpdate.data.c}`);
      } catch (error) {
        console.log('Crypto stream test skipped - service unavailable');
        this.skip();
      }
    });

    it('should handle multiple concurrent connections', async function() {
      // Create multiple echo connections
      restified.createWebSocketClient('echo2', {
        url: 'wss://echo.websocket.org',
        timeout: 10000
      });

      await restified.connectWebSocket('echo2');
      
      const client1 = restified.getWebSocketClient('echo');
      const client2 = restified.getWebSocketClient('echo2');
      
      expect(client1.isConnected()).to.be.true;
      expect(client2.isConnected()).to.be.true;
      
      // Send different messages on each connection
      client1.clearMessages();
      client2.clearMessages();
      
      await client1.send('Message from connection 1');
      await client2.send('Message from connection 2');
      
      // Verify each connection received its own message
      const msg1 = await client1.waitForMessage(
        (msg) => msg.data === 'Message from connection 1',
        3000
      );
      
      const msg2 = await client2.waitForMessage(
        (msg) => msg.data === 'Message from connection 2',
        3000
      );
      
      expect(msg1.data).to.equal('Message from connection 1');
      expect(msg2.data).to.equal('Message from connection 2');
    });
  });

  describe('Error Handling and Reconnection', function() {
    it('should handle disconnection gracefully', async function() {
      const client = restified.getWebSocketClient('echo');
      
      if (client.isConnected()) {
        await client.disconnect();
        expect(client.isConnected()).to.be.false;
        
        // Test result should show disconnection
        const testResult = client.getTestResult();
        expect(testResult.connected).to.be.false;
        expect(testResult.disconnectionTime).to.be.a('number');
        expect(testResult.messages).to.be.an('array');
      }
    });
  });
});