import { Restified, UtilityUsageExamples, quickStartExample } from '../src/index';

// Quick demonstration
async function main() {
  console.log('🚀 Restified Enterprise Utility System Demo');
  console.log('===========================================\n');
  
  // Quick start
  quickStartExample();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Comprehensive examples
  const restified = new Restified();
  const examples = new UtilityUsageExamples(restified);
  
  await examples.runAllExamples();
  
  console.log('\n🎉 Demo completed! Check the Restified documentation for more details.');
}

// Run the demo
if (require.main === module) {
  main().catch(console.error);
}

export { main as utilitySystemDemo };