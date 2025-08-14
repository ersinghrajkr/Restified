import { expect } from 'chai';
import { VariableStore } from '@core/stores/variable.core';

describe('VariableStore', function() {
  let variableStore: VariableStore;

  beforeEach(function() {
    variableStore = new VariableStore();
  });

  describe('Global Variables', function() {
    it('should set and get global variables', function() {
      variableStore.setGlobalVariable('testKey', 'testValue');
      expect(variableStore.getGlobalVariable('testKey')).to.equal('testValue');
    });

    it('should set multiple global variables', function() {
      const vars = { key1: 'value1', key2: 'value2' };
      variableStore.setGlobalVariables(vars);
      
      expect(variableStore.getGlobalVariable('key1')).to.equal('value1');
      expect(variableStore.getGlobalVariable('key2')).to.equal('value2');
    });
  });

  describe('Local Variables', function() {
    it('should set and get local variables', function() {
      variableStore.setLocalVariable('localKey', 'localValue');
      expect(variableStore.getLocalVariable('localKey')).to.equal('localValue');
    });

    it('should clear local variables', function() {
      variableStore.setLocalVariable('localKey', 'localValue');
      variableStore.clearLocalVariables();
      expect(variableStore.getLocalVariable('localKey')).to.be.undefined;
    });
  });

  describe('Variable Priority', function() {
    it('should prioritize local over global variables', function() {
      variableStore.setGlobalVariable('key', 'globalValue');
      variableStore.setLocalVariable('key', 'localValue');
      
      expect(variableStore.getVariable('key')).to.equal('localValue');
    });

    it('should fall back to global when local not found', function() {
      variableStore.setGlobalVariable('key', 'globalValue');
      
      expect(variableStore.getVariable('key')).to.equal('globalValue');
    });
  });

  describe('Variable Context', function() {
    it('should export all variable contexts', function() {
      variableStore.setGlobalVariable('globalKey', 'globalValue');
      variableStore.setLocalVariable('localKey', 'localValue');
      variableStore.setExtractedVariable('extractedKey', 'extractedValue');

      const context = variableStore.getAllVariables();
      
      expect(context.global.globalKey).to.equal('globalValue');
      expect(context.local.localKey).to.equal('localValue');
      expect(context.extracted.extractedKey).to.equal('extractedValue');
    });
  });
});