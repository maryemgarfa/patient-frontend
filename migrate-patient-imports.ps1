# ─── Script de migration imports — frontend-patient ──────────────────────────
# Exécuter depuis la racine de frontend-patient/
# PowerShell : .\migrate-patient-imports.ps1

$files = Get-ChildItem -Recurse -Include *.ts,*.tsx | Where-Object {
    $_.FullName -notmatch "node_modules" -and $_.FullName -notmatch ".next"
}

$count = 0

foreach ($file in $files) {
    $content  = Get-Content $file.FullName -Raw -Encoding UTF8
    $original = $content

    # ── Imports relatifs vers composants déplacés → alias @/ ─────────────────

    # DateNaissancePicker
    $content = $content -replace "from '.*components/DateNaissancePicker'",  "from '@/components/auth/DateNaissancePicker'"

    # BookingStepper
    $content = $content -replace "from '.*components/BookingStepper'",       "from '@/components/rdv/BookingStepper'"

    # BookingStepperModal
    $content = $content -replace "from '.*components/BookingStepperModal'",  "from '@/components/rdv/BookingStepperModal'"

    # MedecinCalendar
    $content = $content -replace "from '.*components/MedecinCalendar'",      "from '@/components/rdv/MedecinCalendar'"
    $content = $content -replace "from '\.\./components/MedecinCalendar'",   "from '@/components/rdv/MedecinCalendar'"

    # ReschedulePopup
    $content = $content -replace "from '.*components/ReschedulePopup'",      "from '@/components/rdv/ReschedulePopup'"

    # ProfileCompletionStepper
    $content = $content -replace "from '.*components/ProfileCompletionStepper'", "from '@/components/ProfileCompletionStepper'"

    # ── useBookingSlots (déplacé vers hooks/) ─────────────────────────────────
    $content = $content -replace "from '.*hooks/useBookingSlots'",           "from '@/hooks/useBookingSlots'"
    $content = $content -replace "from '.*hooks/useBookingSlots'",           "from '@/hooks/useBookingSlots'"

    # ── Écriture si modifié ───────────────────────────────────────────────────
    if ($content -ne $original) {
        Set-Content $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "✅ $($file.FullName.Replace((Get-Location).Path + '\', ''))"
        $count++
    }
}

Write-Host ""
Write-Host "─────────────────────────────────"
Write-Host "✅ $count fichier(s) mis à jour."
Write-Host "─────────────────────────────────"