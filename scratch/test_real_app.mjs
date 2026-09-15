// Automated End-to-End Real Application Test Suite
const API_BASE = 'http://localhost:8000';

async function runTests() {
  console.log('====================================================');
  console.log('ACCESSAI — REAL APPLICATION INTEGRATION TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // TEST 1: Health Check Endpoint
  console.log('1. Testing GET /api/health:');
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    assert(res.ok, 'Health check returns HTTP 200');
    const data = await res.json();
    assert(data.status === 'ok', 'Status is ok');
    assert(data.ai !== undefined, 'AI capability reported');
    assert(data.ocr?.available === true, 'OCR is available');
    assert(data.navigation?.available === true, 'Navigation is available');
    assert(!JSON.stringify(data).includes('AIza'), 'No API keys leaked in health check');
  } catch (err) {
    assert(false, `Health check failed: ${err.message}`);
  }

  // TEST 2: Voice Chat Basic Query
  console.log('\n2. Testing POST /api/voice/chat (Basic Query):');
  try {
    const res = await fetch(`${API_BASE}/api/voice/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'What can you do to help me?',
        context: { currentPage: 'voice' },
      }),
    });
    assert(res.ok, 'Voice chat returns HTTP 200');
    const data = await res.json();
    assert(typeof data.answer === 'string' && data.answer.length > 0, 'Returns meaningful response text');
    assert(typeof data.confidence === 'number', 'Returns numeric confidence');
    assert(['high', 'medium', 'low'].includes(data.confidenceLevel), 'Returns valid confidenceLevel');
  } catch (err) {
    assert(false, `Voice chat failed: ${err.message}`);
  }

  // TEST 3: Voice Chat Cross-Feature Scene Grounding
  console.log('\n3. Testing POST /api/voice/chat (Cross-Feature Scene Awareness):');
  try {
    const res = await fetch(`${API_BASE}/api/voice/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'What did you see in the camera?',
        context: {
          currentPage: 'voice',
          currentScene: 'Corridor with doorway 3 meters ahead and chair on right',
        },
      }),
    });
    assert(res.ok, 'Voice chat returns HTTP 200 with scene context');
    const data = await res.json();
    assert(
      data.answer.toLowerCase().includes('doorway') ||
      data.answer.toLowerCase().includes('corridor') ||
      data.answer.toLowerCase().includes('chair'),
      'Voice answer reflects recent camera scene context'
    );
  } catch (err) {
    assert(false, `Voice scene context failed: ${err.message}`);
  }

  // TEST 4: Voice Chat Cross-Feature OCR Grounding
  console.log('\n4. Testing POST /api/voice/chat (Cross-Feature OCR Awareness):');
  try {
    const res = await fetch(`${API_BASE}/api/voice/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'What did the sign say?',
        context: {
          currentPage: 'voice',
          lastOcrText: 'Main Entrance — Open 9:00 AM to 6:00 PM. Wheelchair ramp on left.',
        },
      }),
    });
    assert(res.ok, 'Voice chat returns HTTP 200 with OCR context');
    const data = await res.json();
    assert(
      data.answer.toLowerCase().includes('main entrance') ||
      data.answer.toLowerCase().includes('wheelchair') ||
      data.answer.toLowerCase().includes('ramp'),
      'Voice answer reflects recent OCR document text'
    );
  } catch (err) {
    assert(false, `Voice OCR context failed: ${err.message}`);
  }

  // TEST 5: Vision Scene Analysis
  console.log('\n5. Testing POST /api/vision/analyze:');
  try {
    // 1x1 base64 transparent PNG for valid frame payload
    const dummyImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const res = await fetch(`${API_BASE}/api/vision/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: dummyImage,
        question: 'What is ahead and is it safe to move?',
      }),
    });
    assert(res.ok, 'Vision analyze returns HTTP 200');
    const data = await res.json();
    assert(typeof data.description === 'string' && data.description.length > 0, 'Description provided');
    assert(Array.isArray(data.objects), 'Detected objects array returned');
    assert(data.safety && typeof data.safety.riskDetected === 'boolean', 'Safety evaluation returned');
    assert(typeof data.safety.message === 'string', 'Safety message returned');
  } catch (err) {
    assert(false, `Vision analyze failed: ${err.message}`);
  }

  // TEST 6: OCR Extraction, Simplification & Multilingual Translation
  console.log('\n6. Testing OCR Services (Extract, Simplify, Translate):');
  try {
    const dummyImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const extractRes = await fetch(`${API_BASE}/api/ocr/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dummyImage }),
    });
    assert(extractRes.ok, 'OCR extract returns HTTP 200');
    const extractData = await extractRes.json();
    assert(typeof extractData.text === 'string', 'Extracted text returned');

    // Test Simplification
    const simplifyRes = await fetch(`${API_BASE}/api/ocr/simplify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Proceed to the northern concourse where access ramps are situated adjacent to the primary portal.',
      }),
    });
    assert(simplifyRes.ok, 'OCR simplify returns HTTP 200');
    const simplifyData = await simplifyRes.json();
    assert(typeof simplifyData.text === 'string' && simplifyData.text.length > 0, 'Simplified text returned');

    // Test Multilingual Translations (Tamil, Hindi, Telugu)
    const targetLangs = ['ta', 'hi', 'te'];
    for (const lang of targetLangs) {
      const transRes = await fetch(`${API_BASE}/api/ocr/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Main Entrance. Reception on right. Open 9:00 AM - 6:00 PM.',
          targetLanguage: lang,
        }),
      });
      assert(transRes.ok, `Translation to ${lang} returns HTTP 200`);
      const transData = await transRes.json();
      assert(transData.targetLanguage === lang, `Target language matches ${lang}`);
      assert(typeof transData.text === 'string' && transData.text.length > 0, `Translated text non-empty for ${lang}`);
    }
  } catch (err) {
    assert(false, `OCR services failed: ${err.message}`);
  }

  // TEST 7: Accessible Navigation Routing Engine
  console.log('\n7. Testing Accessible Navigation Engine:');
  try {
    const destRes = await fetch(`${API_BASE}/api/navigation/destinations`);
    assert(destRes.ok, 'GET /api/navigation/destinations returns HTTP 200');
    const destData = await destRes.json();
    assert(Array.isArray(destData.destinations) && destData.destinations.length >= 3, 'Supported destinations list returned');

    // Test route calculation with avoidStairs: true
    const routeRes = await fetch(`${API_BASE}/api/navigation/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: 'main-entrance',
        destination: 'accessible-restroom',
        preferences: {
          avoidStairs: true,
          preferRamps: true,
          preferElevators: true,
        },
      }),
    });
    assert(routeRes.ok, 'POST /api/navigation/route returns HTTP 200');
    const routeData = await routeRes.json();
    assert(routeData.stepFree === true, 'Route certified 100% step-free');
    assert(routeData.distanceMeters > 0, 'Realistic non-zero distance returned');
    assert(Array.isArray(routeData.steps) && routeData.steps.length > 1, 'Sequential waypoints returned');
    assert(routeData.steps.every((s) => s.isAccessible === true), 'All steps verified accessible');
    assert(routeData.gpsAvailable === false, 'Explicitly reports GPS unavailable indoors');
  } catch (err) {
    assert(false, `Navigation routing failed: ${err.message}`);
  }

  console.log('\n====================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
