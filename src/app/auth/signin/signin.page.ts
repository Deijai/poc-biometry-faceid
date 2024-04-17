import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { AndroidBiometryStrength, BiometryError, BiometryErrorType, CheckBiometryResult } from '@aparajita/capacitor-biometric-auth/dist/esm/definitions';
import { Storage } from '@ionic/storage';
import { PluginListenerHandle } from '@capacitor/core/types/definitions';
import { IonInput, LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.page.html',
  styleUrls: ['./signin.page.scss'],
})
export class SigninPage implements OnInit, OnDestroy {

  public myForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.min(3)]],
  });

  public appListener!: PluginListenerHandle
  public validateAuthBiometryAndFaceId: boolean = false;
  public acvivateBioemetry: boolean = false;

  @ViewChild('inputEmail', { static: false }) inputEmail!: IonInput;
  @ViewChild('inputPassword', { static: false }) inputPassword!: IonInput;

  constructor(
    private toastController: ToastController,
    private router: Router,
    private loadingCtrl: LoadingController,
    private authService: AuthService,
    private storage: Storage,
    private fb: FormBuilder) {
      this.verifyBiometry();
  }

  async ngOnInit() {
    this.onComponentMounted();
    this.validateAuthBiometryAndFaceId = await this.authService.checkUserInSorage();
    console.log(' this.acvivateBioemetry ',  this.acvivateBioemetry);


    if(this.validateAuthBiometryAndFaceId && this.acvivateBioemetry) {
      console.log('aquiiiii');

      this.authenticate();
    }

    console.log('this.validateAuthBiometryAndFaceId: ', this.validateAuthBiometryAndFaceId);
  }

  public async updateBiometryInfo(info: CheckBiometryResult): Promise<void> {

    if (info.isAvailable) {
      // Biometry is available, info.biometryType will tell you the primary type.
      console.log('if isAvailable: ', info.isAvailable);

    } else {
      // Biometry is not available, info.reason and info.code will tell you why.
      console.log('else isAvailable: ', info.isAvailable, info);
      await this.showAlert('isAvailable: ' + info.isAvailable)
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
      await this.getUserInStorage();

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


  async onLogin() {

    const loading = await this.loadingCtrl.create();
    await loading.present();

    if (this.myForm.invalid) {
      this.myForm.markAllAsTouched();
      await loading.dismiss();
      return;
    }

    this.authService.login(this.myForm.value.email, this.myForm.value.password).subscribe({
      next: async (res) => {

        await this.storage.set('auth', this.myForm.value);
        await this.storage.set('user', res.user);
        await this.storage.set('token', res.token);

        await this.showAlert('Authorization successful!');

        console.log('res ', res);


        await loading.dismiss();
        this.router.navigateByUrl('tabs');
      },
      error: async (err) => {
        console.log('err ', err);

        await loading.dismiss();
      }
    });


    console.log('form: ', this.myForm.value);
  }


  async getUserInStorage() {
    this.storage.get('auth').then(res => {
      console.log('retorno', res );

      this.myForm.get('email')?.setValue(res.email);
      this.myForm.get('password')?.setValue(res.password);
      this.router.navigateByUrl('tabs');

    }).catch(err => console.log)
  }

  public async toggleBiometry(value: boolean) {
    this.acvivateBioemetry =  value;
    this.storage.set('acvivateBioemetry', this.acvivateBioemetry);

    await this.verifyBiometry();

  }

  public async verifyBiometry() {
    this.storage.get('acvivateBioemetry').then(res => {

    this.acvivateBioemetry = res;

    }).catch(err => {
      this.acvivateBioemetry = false;
    });
  }



}
