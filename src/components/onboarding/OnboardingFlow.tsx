import { useState, useCallback } from 'react'
import { userProfileRepo } from '../../storage/user-profile-repository'
import { WelcomeStep } from './WelcomeStep'
import { CameraPermissionStep } from './CameraPermissionStep'
import { GlassesCheckStep } from './GlassesCheckStep'
import { CalibrationStep } from './CalibrationStep'
import { ReadyStep } from './ReadyStep'

type Step = 'welcome' | 'camera' | 'glasses' | 'calibrate' | 'ready'
type CameraStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'error'

interface Props {
  onComplete: () => void
  cameraStatus: CameraStatus
  stream: MediaStream | null
  onStartCamera: () => Promise<void>
}

export function OnboardingFlow({ onComplete, cameraStatus, stream, onStartCamera }: Props) {
  const [step, setStep] = useState<Step>('welcome')
  const [wearsGlasses, setWearsGlasses] = useState(false)

  const handleCameraAllow = async () => {
    try {
      await onStartCamera()
      setStep('glasses')
    } catch {
      // cameraStatus will be 'denied' or 'error' — UI handles it
    }
  }

  const handleCalibrationComplete = useCallback(async (baselineEAR: number) => {
    try {
      await userProfileRepo.saveCalibration(baselineEAR, wearsGlasses)
    } catch (err) {
      console.error('Failed to save calibration:', err)
    }
    setStep('ready')
  }, [wearsGlasses])

  switch (step) {
    case 'welcome':
      return <WelcomeStep onNext={() => setStep('camera')} />

    case 'camera':
      return (
        <CameraPermissionStep
          cameraStatus={cameraStatus}
          onAllow={handleCameraAllow}
          onSkip={() => setStep('ready')}
        />
      )

    case 'glasses':
      return <GlassesCheckStep onAnswer={(answer) => { setWearsGlasses(answer); setStep('calibrate') }} />

    case 'calibrate':
      return (
        <CalibrationStep
          stream={stream}
          onComplete={handleCalibrationComplete}
        />
      )

    case 'ready':
      return <ReadyStep onStart={onComplete} />
  }
}

export type { Step }
