// Imports SOS alert message type used when receiving alert data from socket.
import { SosAlertMessage } from '../types/contact.types';

// Defines the receiver socket return type.
export type ReceiverSocket = {
  // Function used to close the WebSocket connection.
  close: () => void;
};

// Defines input props needed to connect receiver socket.
type ConnectReceiverSocketInput = {
  // Backend server/laptop IP address.
  serverIp: string;

  // Callback function called when SOS alert is received.
  onAlert: (alert: SosAlertMessage) => void;

  // Optional callback called when socket connection opens.
  onOpen?: () => void;

  // Optional callback called when socket connection closes.
  onClose?: () => void;

  // Optional callback called when socket error happens.
  onError?: (message: string) => void;
};

// Function to connect receiver WebSocket for SOS alerts.
export const connectReceiverSocket = (
  // Contains server IP and callback functions.
  input: ConnectReceiverSocketInput,
): ReceiverSocket => {
  // Creates WebSocket connection with backend alert socket URL.
  const socket = new WebSocket(`ws://${input.serverIp}:8000/ws/alerts`);

  // Runs when WebSocket connection is successfully opened.
  socket.onopen = () => {
    // Calls onOpen callback if it was provided.
    input.onOpen?.();
  };

  // Runs when a message is received from WebSocket.
  socket.onmessage = event => {
    try {
      // Converts received socket message string into JSON object.
      const data = JSON.parse(event.data);

      // Checks if received message is an SOS alert.
      if (data.type === 'SOS_ALERT') {
        // Sends alert data back to caller through onAlert callback.
        input.onAlert(data);
      }
    } catch {
      // Handles invalid JSON or invalid alert data.
      input.onError?.('Invalid receiver alert data');
    }
  };

  // Runs when WebSocket connection has an error.
  socket.onerror = () => {
    // Sends socket error message to caller if onError exists.
    input.onError?.('Receiver socket connection failed');
  };

  // Runs when WebSocket connection is closed.
  socket.onclose = () => {
    // Calls onClose callback if it was provided.
    input.onClose?.();
  };

  // Returns object with close function so caller can close socket manually.
  return {
    // Closes the active WebSocket connection.
    close: () => socket.close(),
  };
};
