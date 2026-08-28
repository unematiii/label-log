import { Alert, Button, Text } from '@expo/ui/swift-ui';
import { cloneElement, ReactElement, useState } from 'react';

type TriggerProps = {
  onPress?: () => void;
};

type DeleteProductAlertProps = {
  children: ReactElement<TriggerProps>;
  onConfirm: () => void;
};

export function DeleteProductAlert({
  children,
  onConfirm,
}: DeleteProductAlertProps) {
  const [isPresented, setIsPresented] = useState(false);
  const trigger = cloneElement(children, {
    onPress: () => setIsPresented(true),
  });

  const handleConfirm = () => {
    setIsPresented(false);
    onConfirm();
  };

  return (
    <Alert
      title="Delete product?"
      isPresented={isPresented}
      onIsPresentedChange={setIsPresented}
    >
      <Alert.Trigger>{trigger}</Alert.Trigger>
      <Alert.Actions>
        <Button label="Delete" role="destructive" onPress={handleConfirm} />
        <Button label="Cancel" role="cancel" />
      </Alert.Actions>
      <Alert.Message>
        <Text>This permanently removes the product from your catalogue.</Text>
      </Alert.Message>
    </Alert>
  );
}
