const { exec } = require('child_process');
const os = require('os');

// ─── CPU usage (1-second delta) ───────────────────────────────────────────────
function getCpuUsage() {
  return new Promise((resolve) => {
    const t1 = os.cpus();
    setTimeout(() => {
      const t2 = os.cpus();
      let idle = 0, total = 0;
      t2.forEach((c, i) => {
        const d1 = t1[i].times, d2 = c.times;
        const di = d2.idle - d1.idle;
        const dt = Object.values(d2).reduce((a, v) => a + v, 0) -
                   Object.values(d1).reduce((a, v) => a + v, 0);
        idle  += di;
        total += dt;
      });
      resolve(Math.round(100 - (idle / total) * 100));
    }, 700);
  });
}

// ─── RAM ──────────────────────────────────────────────────────────────────────
function getRam() {
  const total = os.totalmem();
  const free  = os.freemem();
  return {
    ramUsed:  Math.round((total - free) / (1024 ** 3) * 10) / 10,
    ramTotal: Math.round(total / (1024 ** 3) * 10) / 10,
    ramPct:   Math.round(((total - free) / total) * 100),
  };
}

// ─── Network speed ────────────────────────────────────────────────────────────
// netstat-based — lightweight PowerShell approach
let prevRx = 0, prevTx = 0, prevNetTime = Date.now();

function getNetworkSpeed() {
  return new Promise((resolve) => {
    const ps = `
      $n=(Get-NetAdapterStatistics | Where-Object {$_.ReceivedBytes -gt 0 -and $_.SentBytes -gt 0});
      if($n){$rx=($n|Measure-Object ReceivedBytes -Sum).Sum;$tx=($n|Measure-Object SentBytes -Sum).Sum;
      Write-Output "$rx $tx"} else{Write-Output "0 0"}
    `.trim().replace(/\n\s+/g,' ');

    exec(`powershell -NoProfile -NonInteractive -Command "${ps}"`, { timeout: 2000 }, (err, out) => {
      if (err || !out?.trim()) return resolve({ downKBs: 0, upKBs: 0 });
      const [rx, tx] = out.trim().split(' ').map(Number);
      const now  = Date.now();
      const dt   = (now - prevNetTime) / 1000;
      const down = Math.max(0, Math.round((rx - prevRx) / 1024 / dt));
      const up   = Math.max(0, Math.round((tx - prevTx) / 1024 / dt));
      prevRx = rx; prevTx = tx; prevNetTime = now;
      resolve({ downKBs: down, upKBs: up });
    });
  });
}

async function getCpuAndRam() {
  const cpu = await getCpuUsage();
  return { cpu, ...getRam() };
}

module.exports = { getCpuAndRam, getNetworkSpeed };
