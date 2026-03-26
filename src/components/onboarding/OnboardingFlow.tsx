import { useState, useEffect } from 'react'
import { useCamera } from '../../hooks/use-camera'
import { userProfileRepo } from '../../storage/user-profile-repository'
import { WelcomeStep } from './WelcomeStep'
import { CameraPermissionStep } from './CameraPermissionStep'
import { GlassesCheckStep } from './GlassesCheckStep'
import { CalibrationStep } from './CalibrationStep'
import { ReadyStep } from './ReadyStep'

type Step = 'welcome' | 'camera' | 'glasses' | 'calibrate' | 'ready'

interface Props {
  onComplete: () => void
}

export function OnboardingFlow({ onComplete }: Props) {
  const [step, setStep] = useState<Step>('welcome')
  const [wearsGlasses, setWearsGlasses] = useState(false)
  const { status: cameraStatus, stream, start: startCamera } = useCamera()

  // Advance to glasses step once camera becomes active
  useEffect(() => {
    if (step === 'camera' && cameraStatus === 'active') {
      setStep('glasses')
    }
  }, [cameraStatus, step])

  const handleCameraAllow = () => {
    startCamera().catch(() => {
      // status will be updated to 'denied' or 'error' by the hook
    })
  }

  const handleCameraSkip = () => {
    setStep('ready')
  }

  const handleGlassesAnswer = (answer: boolean) => {
    setWearsGlasses(answer)
    setStep('calibrate')
  }

  const handleCalibrationComplete = async (baselineEAR: number) => {
    try {
      await userProfileRepo.saveCalibration(baselineEAR, wearsGlasses)
    } catch (err) {
      console.error('Failed to save calibration:', err)
    }
    setStep('ready')
  }

  switch (step) {
    case 'welcome':
      return <WelcomeStep onNext={() => setStep('camera')} />

    case 'camera':
      return (
        <CameraPermissionStep
          cameraStatus={cameraStatus}
          onAllow={handleCameraAllow}
          onSkip={handleCameraSkip}
        />
      )

    case 'glasses':
      return <GlassesCheckStep onAnswer={handleGlassesAnswer} />

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
