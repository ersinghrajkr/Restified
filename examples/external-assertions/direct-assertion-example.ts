/**
 * Direct Assertion Integration Example
 * 
 * This example shows the clean, direct way to capture chai, playwright, 
 * and other assertion library calls in RestifiedTS reports.
 */

import { restified } from '../../src';

describe('Direct Assertion Integration', function() {
  this.timeout(10000);

  it('should capture Chai expect() assertions directly', async function() {
    console.log('🚀 Testing direct Chai expect() capture...');

    const response = await restified
      .given()
        .baseURL('https://jsonplaceholder.typicode.com')
      .when()
        .get('/users/1')
        .execute();

    await response
      .statusCode(200)
      .jsonPath('$.name')
      .execute();

    // Direct Chai assertion capture
    response.startCapturing();
    const expect = response.expect;
    const responseData = response.getResponse().data;

    // These Chai assertions will be captured in the RestifiedTS report
    expect(responseData.id).to.equal(1);
    expect(responseData.name).to.be.a('string');
    expect(responseData.email).to.contain('@');
    expect(responseData.website).to.match(/\w+\.\w+/);

    const captured = await response.finishCapturing();
    console.log(`✅ Captured ${captured.length} Chai assertions`);

    // Verify assertions were captured
    if (captured.length !== 4) {
      throw new Error(`Expected 4 captured assertions, got ${captured.length}`);
    }
  });

  it('should capture Playwright expect() assertions directly', async function() {
    console.log('🚀 Testing direct Playwright expect() capture...');

    const response = await restified
      .given()
        .baseURL('https://jsonplaceholder.typicode.com')
      .when()
        .get('/posts/1')
        .execute();

    await response.statusCode(200).execute();

    // Direct Playwright assertion capture
    response.startCapturing();
    const expect = response.playwright;
    const responseData = response.getResponse().data;

    // These Playwright-style assertions will be captured (fallback to Chai if Playwright not available)
    try {
      expect(responseData.id).toBe(1);
      expect(responseData.title).toBeTruthy();
      expect(responseData.body).toContain('quia');
      expect(responseData.userId).toBeGreaterThan(0);
    } catch (error) {
      // Fallback to Chai syntax if Playwright methods don't exist
      const chaiExpect = response.expect;
      chaiExpect(responseData.id).to.equal(1);
      chaiExpect(responseData.title).to.be.a('string');
      chaiExpect(responseData.body).to.contain('quia');
      chaiExpect(responseData.userId).to.be.greaterThan(0);
    }

    const captured = await response.finishCapturing();
    console.log(`✅ Captured ${captured.length} Playwright assertions`);

    // Verify assertions were captured
    if (captured.length !== 4) {
      throw new Error(`Expected 4 captured assertions, got ${captured.length}`);
    }
  });

  it('should capture Node.js assert calls directly', async function() {
    console.log('🚀 Testing direct Node.js assert capture...');

    const response = await restified
      .given()
        .baseURL('https://jsonplaceholder.typicode.com')
      .when()
        .get('/users/2')
        .execute();

    await response.statusCode(200).execute();

    // Direct Node.js assert capture
    response.startCapturing();
    const assert = response.assert;
    const responseData = response.getResponse().data;

    // These Node.js assertions will be captured
    assert.equal(responseData.id, 2);
    assert.strictEqual(responseData.username, 'Antonette');
    assert.ok(responseData.email);

    const captured = await response.finishCapturing();
    console.log(`✅ Captured ${captured.length} Node.js assert calls`);

    // Verify assertions were captured
    if (captured.length !== 3) {
      throw new Error(`Expected 3 captured assertions, got ${captured.length}`);
    }
  });

  it('should use withAssertions callback for clean syntax', async function() {
    console.log('🚀 Testing withAssertions callback approach...');

    const response = await restified
      .given()
        .baseURL('https://jsonplaceholder.typicode.com')
      .when()
        .get('/albums/1')
        .execute();

    await response.statusCode(200).execute();

    const responseData = response.getResponse().data;

    // Clean callback syntax with direct access to all assertion libraries
    const captured = await response.withAssertions((expect, playwright, assert) => {
      // Use Chai assertions (expect is Chai expect)
      expect(responseData.id).to.equal(1);
      expect(responseData.title).to.be.a('string');
      
      // Try Playwright-style, fallback to Chai
      try {
        playwright(responseData.userId).toBe(1);
        playwright(responseData.title).toBeTruthy();
      } catch (error) {
        // Fallback to Chai
        expect(responseData.userId).to.equal(1);
        expect(responseData.title).to.be.a('string');
      }
      
      // Node.js assert
      assert.ok(responseData.id);
      assert.equal(responseData.userId, 1);
    });

    console.log(`✅ Captured ${captured.length} mixed assertions via callback`);

    // Verify we got all assertion types
    const chaiCount = captured.filter(a => a.type === 'chai').length;
    const playwrightCount = captured.filter(a => a.type === 'playwright').length;
    const assertCount = captured.filter(a => a.type === 'assert').length;

    console.log(`  - Chai: ${chaiCount}, Playwright: ${playwrightCount}, Assert: ${assertCount}`);

    if (captured.length < 4) {
      throw new Error(`Expected at least 4 captured assertions, got ${captured.length}`);
    }
  });

  it('should capture assertion failures correctly', async function() {
    console.log('🚀 Testing assertion failure capture...');

    const response = await restified
      .given()
        .baseURL('https://jsonplaceholder.typicode.com')
      .when()
        .get('/users/3')
        .execute();

    await response.statusCode(200).execute();

    const responseData = response.getResponse().data;
    let capturedAssertions;
    let errorOccurred = false;

    try {
      capturedAssertions = await response.withAssertions((expect, playwright, assert) => {
        // This will pass
        expect(responseData.id).to.equal(3);
        
        // This will fail and throw error
        expect(responseData.id).to.equal(999);
      });
    } catch (error) {
      errorOccurred = true;
      // Get the captured assertions even after failure
      capturedAssertions = await response.finishCapturing();
    }

    console.log('✅ Assertion failure handled correctly');
    console.log(`  - Error thrown: ${errorOccurred}`);
    console.log(`  - Assertions captured: ${(await capturedAssertions)?.length || 0}`);

    if (!errorOccurred) {
      throw new Error('Expected assertion to fail and throw error');
    }
  });

  afterEach(function() {
    // Clean up any remaining captured data
    restified.clearExternalAssertions?.();
  });
});