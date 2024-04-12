import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { AndroidBiometryStrength, BiometryError, BiometryErrorType, CheckBiometryResult } from '@aparajita/capacitor-biometric-auth/dist/esm/definitions';
import { Capacitor } from '@capacitor/core';
import { PluginListenerHandle } from '@capacitor/core/types/definitions';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.page.html',
  styleUrls: ['./signin.page.scss'],
})
export class SigninPage implements OnInit, OnDestroy {

  public appListener!: PluginListenerHandle

  constructor(private toastController: ToastController, private router: Router) { }

  ngOnInit() {
    this.onComponentMounted();
  }

  public async updateBiometryInfo(info: CheckBiometryResult): Promise<void> {

    if (info.isAvailable) {
      // Biometry is available, info.biometryType will tell you the primary type.
      console.log('if isAvailable: ', info.isAvailable);

    } else {
      // Biometry is not available, info.reason and info.code will tell you why.
      console.log('else isAvailable: ', info.isAvailable, info);
      await this.showAlert('isAvailable: '+info.isAvailable)
    }
  }

  async onComponentMounted(): Promise<void> {
    this.updateBiometryInfo(await BiometricAuth.checkBiometry());
    try {
      this.appListener = await BiometricAuth.addResumeListener(this.updateBiometryInfo);

      console.log('appListener: ', this.appListener);


    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message)
      }
    }
  }

  async onComponentUnmounted(): Promise<void> {
    await this.appListener?.remove()
  }

  ngOnDestroy(): void {
    this.onComponentUnmounted();
  }

  async authenticate(): Promise<void> {
    try {
      await BiometricAuth.authenticate({
        reason: 'Please authenticate',
        cancelTitle: 'Cancel',
        allowDeviceCredential: true,
        iosFallbackTitle: 'Use passcode',
        androidTitle: 'Biometric login',
        androidSubtitle: 'Log in using biometric authentication',
        androidConfirmationRequired: false,
        androidBiometryStrength: AndroidBiometryStrength.weak,
      });

      await this.showAlert('Authorization successful!');
      this.router.navigateByUrl('tabs');

    } catch (error) {
      console.log('error: ', error);

      // error is always an instance of BiometryError.
      if (error instanceof BiometryError) {
        if (error.code !== BiometryErrorType.userCancel) {
          // Display the error.
          await this.showAlert(error.message)
        }
      }
    }
  }

  private async showAlert(msg: string) {
    const toast = await this.toastController.create({
      duration: 6000,
      message: msg,
      mode: 'ios'
    });

    await toast.present();
  }


}
