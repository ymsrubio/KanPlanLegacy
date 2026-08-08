const { chromium } = require('playwright');
const { spawn } = require('child_process');
const http = require('http');

function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      http.get(url, (res) => {
        if (res.statusCode === 200) resolve();
        else retry();
      }).on('error', retry);
    }
    function retry() {
      if (Date.now() - start > timeoutMs) reject(new Error('Server timeout: ' + url));
      else setTimeout(check, 500);
    }
    check();
  });
}

(async () => {
  let devProcess = null;

  try {
    // Check if dev server running, if not start it
    try {
      await waitForServer('http://localhost:5173', 1000);
      console.log('Dev server already running at http://localhost:5173');
    } catch {
      console.log('Starting dev server (npm run dev)...');
      devProcess = spawn('npm', ['run', 'dev'], { stdio: 'pipe', shell: true });
      await waitForServer('http://localhost:5173', 15000);
      console.log('Dev server ready!');
    }

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('http://localhost:5173');

    // Wait for Kanban board and Calendar grid to load
    await page.waitForSelector('.kanban-task-card');
    await page.waitForSelector('.fc-timegrid-slot');

    console.log('--- Test 1: Dragging from main task card body (.kanban-task-card) ---');
    const taskCard = page.locator('.kanban-task-card').first();
    const calendarSlot = page.locator('.fc-timegrid-slot').first();

    const taskBox = await taskCard.boundingBox();
    const slotBox = await calendarSlot.boundingBox();

    if (!taskBox || !slotBox) {
      throw new Error('Elements not visible for bounding box');
    }

    // Drag from main card body (center of card, offset from fc-drag-handle)
    await page.mouse.move(taskBox.x + 20, taskBox.y + 10);
    await page.mouse.down();
    await page.mouse.move(slotBox.x + 50, slotBox.y + 20, { steps: 10 });

    // Check if FullCalendar mirror/preview renders on calendar (.fc-event-mirror)
    const mirrorVisible = await page.locator('.fc .fc-event-mirror, .fc-event-mirror').isVisible().catch(() => false);
    console.log('Is FullCalendar drag mirror visible when dragging main card body?:', mirrorVisible);

    await page.mouse.up();

    console.log('--- Test 2: Dragging from dedicated drag handle (.fc-drag-handle) ---');
    const dragHandle = page.locator('.fc-drag-handle').first();
    const handleBox = await dragHandle.boundingBox();

    if (handleBox) {
      await page.mouse.move(handleBox.x + 5, handleBox.y + 5);
      await page.mouse.down();
      await page.mouse.move(slotBox.x + 50, slotBox.y + 50, { steps: 10 });

      const mirrorVisibleHandle = await page.locator('.fc .fc-event-mirror, .fc-event-mirror').isVisible().catch(() => false);
      console.log('Is FullCalendar drag mirror visible when dragging .fc-drag-handle?:', mirrorVisibleHandle);
      await page.mouse.up();
    }

    await browser.close();

    if (!mirrorVisible) {
      console.error('FAIL: Dragging main task card body does NOT reflect on FullCalendar grid!');
      process.exit(1);
    } else {
      console.log('SUCCESS: Dragging reflects on calendar grid.');
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution error:', err.message);
    if (devProcess) devProcess.kill();
    process.exit(1);
  } finally {
    if (devProcess) devProcess.kill();
  }
})();
