import { useState } from 'react';

export default function useSnackbar() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info'); // 'success', 'error', 'info'

  function showSnackbar(msg, msgType = 'info') {
    setMessage(msg);
    setType(msgType);
    setVisible(true);
    setTimeout(() => setVisible(false), 3000);
  }

  return {
    visible,
    message,
    type,
    showSnackbar,
    dismissSnackbar: () => setVisible(false)
  };
}
