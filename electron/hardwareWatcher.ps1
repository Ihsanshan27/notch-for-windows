Add-Type -AssemblyName System.Windows.Forms
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public class CoreAudioVolume {
    [Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    private interface IAudioEndpointVolume {
        int f(); int g(); int h(); int i();
        int SetMasterVolumeLevelScalar(float fLevel, System.Guid pguidEventContext);
        int j();
        int GetMasterVolumeLevelScalar(out float pfLevel);
        int k(); int l(); int m(); int n();
        int SetMute([MarshalAs(UnmanagedType.Bool)] bool bMute, System.Guid pguidEventContext);
        int GetMute(out bool pbMute);
    }

    [Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    private interface IMMDevice {
        int Activate(ref System.Guid id, int clsCtx, int activationParams, out IAudioEndpointVolume aev);
    }

    [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    private interface IMMDeviceEnumerator {
        int f();
        int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice endpoint);
    }

    [ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
    private class MMDeviceEnumeratorComObject {}

    private static IAudioEndpointVolume GetEndpointVolume() {
        var enumerator = new MMDeviceEnumeratorComObject() as IMMDeviceEnumerator;
        IMMDevice dev = null;
        Marshal.ThrowExceptionForHR(enumerator.GetDefaultAudioEndpoint(0, 1, out dev));
        IAudioEndpointVolume epv = null;
        var epvid = typeof(IAudioEndpointVolume).GUID;
        Marshal.ThrowExceptionForHR(dev.Activate(ref epvid, 23, 0, out epv));
        return epv;
    }

    public static float GetVolume() {
        float volume = 0;
        var epv = GetEndpointVolume();
        Marshal.ThrowExceptionForHR(epv.GetMasterVolumeLevelScalar(out volume));
        return volume * 100f;
    }

    public static bool GetMuteStatus() {
        bool isMuted = false;
        var epv = GetEndpointVolume();
        Marshal.ThrowExceptionForHR(epv.GetMute(out isMuted));
        return isMuted;
    }
}
'@

$prevCaps = $null
$prevVol = $null
$prevMute = $null

# First read to initialize
try {
    $prevCaps = [System.Windows.Forms.Control]::IsKeyLocked([System.Windows.Forms.Keys]::CapsLock)
    $prevVol = [Math]::Round([CoreAudioVolume]::GetVolume())
    $prevMute = [CoreAudioVolume]::GetMuteStatus()
    [Console]::WriteLine("READY:CAPS=" + $prevCaps + ",VOL=" + $prevVol + ",MUTE=" + $prevMute)
} catch {}

$iterCount = 0
while ($true) {
    try {
        $c = [System.Windows.Forms.Control]::IsKeyLocked([System.Windows.Forms.Keys]::CapsLock)
        if ($c -ne $prevCaps) {
            $prevCaps = $c
            [Console]::WriteLine("CAPS:" + $c)
        }

        $v = [Math]::Round([CoreAudioVolume]::GetVolume())
        $m = [CoreAudioVolume]::GetMuteStatus()
        if ($v -ne $prevVol -or $m -ne $prevMute) {
            $prevVol = $v
            $prevMute = $m
            [Console]::WriteLine("VOL:" + $v + ":" + $m)
        }

        $iterCount++
        if ($iterCount -ge 400) {
            $iterCount = 0
            [GC]::Collect()
        }
    } catch {}

    Start-Sleep -Milliseconds 125
}
