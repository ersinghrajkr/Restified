import { Restified } from '../src/index';

// Comprehensive date formatting demonstration
function demonstrateDateFormatting() {
  console.log('🗓️  Restified Date Utilities - Flexible Formatting Demo');
  console.log('=====================================================\n');
  
  const restified = new Restified();
  const baseDate = '2024-06-15T14:30:45.123Z';
  
  console.log(`Base Date: ${baseDate}\n`);
  
  // Built-in format options
  console.log('=== Built-in Format Options ===');
  console.log('ISO (default):', restified.dateUtil('format', baseDate, 'ISO').value);
  console.log('Timestamp:', restified.dateUtil('format', baseDate, 'timestamp').value);
  console.log('Unix:', restified.dateUtil('format', baseDate, 'unix').value);
  console.log('Date only:', restified.dateUtil('format', baseDate, 'date-only').value);
  console.log('Time only:', restified.dateUtil('format', baseDate, 'time-only').value);
  console.log('Local string:', restified.dateUtil('format', baseDate, 'local').value);
  console.log('UTC string:', restified.dateUtil('format', baseDate, 'utc').value);
  
  // Custom format patterns
  console.log('\n=== Custom Format Patterns ===');
  console.log('YYYY-MM-DD:', restified.dateUtil('format', baseDate, 'YYYY-MM-DD').value);
  console.log('DD/MM/YYYY:', restified.dateUtil('format', baseDate, 'DD/MM/YYYY').value);
  console.log('MM-DD-YY:', restified.dateUtil('format', baseDate, 'MM-DD-YY').value);
  console.log('YYYY-MM-DD HH:mm:ss:', restified.dateUtil('format', baseDate, 'YYYY-MM-DD HH:mm:ss').value);
  console.log('DD/MM/YYYY HH:mm:', restified.dateUtil('format', baseDate, 'DD/MM/YYYY HH:mm').value);
  console.log('YYYY-MM-DD HH:mm:ss.SSS:', restified.dateUtil('format', baseDate, 'YYYY-MM-DD HH:mm:ss.SSS').value);
  console.log('Custom text format:', restified.dateUtil('format', baseDate, 'Date: YYYY-MM-DD Time: HH:mm:ss').value);
  
  // Add/subtract operations with different formats
  console.log('\n=== Add/Subtract with Custom Formats ===');
  console.log('Add 5 days (ISO):', restified.dateUtil('addDays', baseDate, 5).value);
  console.log('Add 5 days (date-only):', restified.dateUtil('addDays', baseDate, 5, 'date-only').value);
  console.log('Add 5 days (timestamp):', restified.dateUtil('addDays', baseDate, 5, 'timestamp').value);
  console.log('Add 5 days (DD/MM/YYYY):', restified.dateUtil('addDays', baseDate, 5, 'DD/MM/YYYY').value);
  
  console.log('Add 3 hours (ISO):', restified.dateUtil('addHours', baseDate, 3).value);
  console.log('Add 3 hours (HH:mm:ss):', restified.dateUtil('addHours', baseDate, 3, 'HH:mm:ss').value);
  console.log('Add 3 hours (YYYY-MM-DD HH:mm):', restified.dateUtil('addHours', baseDate, 3, 'YYYY-MM-DD HH:mm').value);
  
  console.log('Subtract 2 months (YYYY-MM):', restified.dateUtil('subtractMonths', baseDate, 2, 'YYYY-MM').value);
  console.log('Subtract 1 year (YYYY):', restified.dateUtil('subtractYears', baseDate, 1, 'YYYY').value);
  
  // Period boundaries with custom formats
  console.log('\n=== Period Boundaries with Custom Formats ===');
  console.log('Start of day (ISO):', restified.dateUtil('startOfDay', baseDate).value);
  console.log('Start of day (date-only):', restified.dateUtil('startOfDay', baseDate, 'date-only').value);
  console.log('Start of day (timestamp):', restified.dateUtil('startOfDay', baseDate, 'timestamp').value);
  
  console.log('End of month (YYYY-MM-DD):', restified.dateUtil('endOfMonth', baseDate, 'YYYY-MM-DD').value);
  console.log('Start of year (YYYY-MM-DD HH:mm:ss):', restified.dateUtil('startOfYear', baseDate, 'YYYY-MM-DD HH:mm:ss').value);
  
  // Variable resolution with formatting
  console.log('\n=== Variable Resolution with Formatting ===');
  
  // Set some variables for demonstration
  restified.setGlobalVariable('eventDate', baseDate);
  restified.setLocalVariable('daysToAdd', 30);
  
  const template = {
    event: {
      original: '{{eventDate}}',
      formatted: '{{$util.format({{eventDate}}, "DD/MM/YYYY HH:mm")}}',
      futureDate: '{{$util.addDays({{eventDate}}, {{daysToAdd}}, "YYYY-MM-DD")}}',
      startOfEventMonth: '{{$util.startOfMonth({{eventDate}}, "YYYY-MM-DD")}}',
      timestamp: '{{$util.format({{eventDate}}, "timestamp")}}',
      dayName: '{{$util.getDayOfWeekName({{eventDate}})}}',
      monthName: '{{$util.getMonthName({{eventDate}})}}',
      isWeekend: '{{$util.isWeekend({{eventDate}})}}'
    },
    reporting: {
      current: '{{$util.now("YYYY-MM-DD HH:mm:ss")}}',
      today: '{{$util.today("DD/MM/YYYY")}}',
      yesterday: '{{$util.subtractDays({{$util.now()}}, 1, "YYYY-MM-DD")}}',
      nextWeek: '{{$util.addWeeks({{$util.now()}}, 1, "DD/MM/YYYY")}}',
      timestampNow: '{{$util.now("timestamp")}}'
    }
  };
  
  const resolved = restified.resolveVariables(template);
  console.log('Resolved template:', JSON.stringify(resolved, null, 2));
  
  // Real-world use cases
  console.log('\n=== Real-World Use Cases ===');
  
  // API testing scenarios
  const apiTestScenarios = {
    // Date range queries
    startDate: restified.dateUtil('subtractDays', baseDate, 30, 'YYYY-MM-DD').value,
    endDate: restified.dateUtil('addDays', baseDate, 30, 'YYYY-MM-DD').value,
    
    // Timestamp for unique IDs
    uniqueId: `test_${restified.dateUtil('now', 'timestamp').value}`,
    
    // ISO dates for API requests
    createdAt: restified.dateUtil('now', 'ISO').value,
    updatedAt: restified.dateUtil('addMinutes', baseDate, 5, 'ISO').value,
    
    // Unix timestamps for systems that need them
    unixCreated: restified.dateUtil('now', 'unix').value,
    unixExpiry: restified.dateUtil('addDays', baseDate, 365, 'unix').value,
    
    // Formatted dates for reports
    reportDate: restified.dateUtil('now', 'DD/MM/YYYY').value,
    reportTime: restified.dateUtil('now', 'HH:mm:ss').value,
    
    // Business logic dates
    nextBusinessDay: restified.dateUtil('addDays', baseDate, 1, 'YYYY-MM-DD').value,
    quarterStart: restified.dateUtil('startOfMonth', baseDate, 'YYYY-MM-DD').value,
    yearEnd: restified.dateUtil('endOfYear', baseDate, 'YYYY-MM-DD').value
  };
  
  console.log('API Test Scenarios:', JSON.stringify(apiTestScenarios, null, 2));
  
  console.log('\n✅ Date formatting demonstration completed!');
  console.log('\n📋 Available Format Options:');
  console.log('Built-in: ISO, timestamp, unix, date-only, time-only, local, utc');
  console.log('Custom patterns: YYYY, YY, MM, M, DD, D, HH, H, mm, m, ss, s, SSS');
  console.log('Example patterns: "YYYY-MM-DD", "DD/MM/YYYY HH:mm:ss", "timestamp", etc.');
}

// Run the demo
if (require.main === module) {
  demonstrateDateFormatting();
}

export { demonstrateDateFormatting };