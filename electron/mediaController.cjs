const { exec } = require('child_process');

// ─── Media key via PowerShell ─────────────────────────────────────────────────
const KEY_MAP = {
  playPause: '0xB3', next: '0xB0', prev: '0xB1',
  volumeUp: '0xAF',  volumeDown: '0xAE', mute: '0xAD',
};

function sendMediaKey(keyType) {
  const vk = KEY_MAP[keyType] || '0xB3';
  // Correct PowerShell: use a simple keystroke via wscript
  const ps = `
    $wsh = New-Object -ComObject WScript.Shell;
    $wsh.SendKeys([char][int]${vk})
  `.trim().replace(/\n\s+/g, '; ');

  exec(`powershell -NoProfile -NonInteractive -Command "${ps}"`, (err) => {
    if (err) console.warn('[MediaKey] Error:', err.message);
  });
}

// ─── Windows SMTC query ───────────────────────────────────────────────────────
function queryWindowsSMTC(callback) {
  const ps = `
    Add-Type -AssemblyName System.Runtime.WindowsRuntime;
    $atg = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
      $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
      $_.GetParameters()[0].ParameterType.Name -like 'IAsyncOperation*'
    })[0];
    function Await($op, $t) { $m=$atg.MakeGenericMethod($t); $task=$m.Invoke($null,@($op)); $task.Wait(-1)|Out-Null; $task.Result }
    [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime]|Out-Null;
    $mgr=Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]);
    $sess=$mgr.GetCurrentSession();
    if ($sess) {
      $props=Await ($sess.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties]);
      $info=$sess.GetPlaybackInfo();
      @{ hasMedia=$true; title=$props.Title; artist=$props.Artist; album=$props.AlbumTitle; status=$info.PlaybackStatus.ToString() } | ConvertTo-Json -Compress
    } else { @{ hasMedia=$false } | ConvertTo-Json -Compress }
  `.trim().replace(/\n\s+/g, ' ');

  exec(`powershell -NoProfile -NonInteractive -Command "${ps}"`, { timeout: 4000 }, (err, out) => {
    if (err || !out?.trim()) return callback({ hasMedia: false });
    try { callback(JSON.parse(out.trim())); }
    catch { callback({ hasMedia: false }); }
  });
}

module.exports = { sendMediaKey, queryWindowsSMTC };
