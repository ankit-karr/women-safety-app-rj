declare module 'react-native-get-sms-android' {
  type Callback = (message: string) => void;

  const SmsAndroid: {
    autoSend: (
      phoneNumber: string,
      message: string,
      failCallback: Callback,
      successCallback: Callback,
    ) => void;
  };

  export default SmsAndroid;
}
