import {
  Button,
  Form,
  Host,
  LabeledContent,
  Picker,
  Section,
  Text,
  TextField,
  useNativeState,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  disabled,
  keyboardType,
  pickerStyle,
  tag,
} from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';

import { ProductInput } from '@/database';

type ProductFormProps = {
  initialValues?: Partial<ProductInput>;
  submitLabel?: string;
  onSubmit: (product: ProductInput) => Promise<void> | void;
};

const numberFields = [
  ['basisAmount', 'Basis amount'],
  ['servingAmount', 'Serving amount'],
  ['energyKj', 'Energy (kJ)'],
  ['energyKcal', 'Energy (kcal)'],
  ['fatG', 'Fat (g)'],
  ['saturatedFatG', 'Saturated fat (g)'],
  ['carbohydratesG', 'Carbohydrates (g)'],
  ['sugarsG', 'Sugars (g)'],
  ['fibreG', 'Fibre (g)'],
  ['proteinG', 'Protein (g)'],
  ['saltG', 'Salt (g)'],
  ['sodiumMg', 'Sodium (mg)'],
] as const;

type NumberField = (typeof numberFields)[number][0];

function initialNumber(value: number | undefined): string {
  return value === undefined ? '' : String(value);
}

function parseNumber(value: string): number | null {
  if (!value.trim()) return null;

  const number = Number(value.replace(',', '.'));
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function ProductForm({
  initialValues = {},
  submitLabel = 'Save Product',
  onSubmit,
}: ProductFormProps) {
  const code = useNativeState(initialValues.code ?? '');
  const name = useNativeState(initialValues.name ?? '');
  const basisAmount = useNativeState(initialNumber(initialValues.basisAmount));
  const servingAmount = useNativeState(
    initialNumber(initialValues.servingAmount)
  );
  const energyKj = useNativeState(initialNumber(initialValues.energyKj));
  const energyKcal = useNativeState(initialNumber(initialValues.energyKcal));
  const fatG = useNativeState(initialNumber(initialValues.fatG));
  const saturatedFatG = useNativeState(
    initialNumber(initialValues.saturatedFatG)
  );
  const carbohydratesG = useNativeState(
    initialNumber(initialValues.carbohydratesG)
  );
  const sugarsG = useNativeState(initialNumber(initialValues.sugarsG));
  const fibreG = useNativeState(initialNumber(initialValues.fibreG));
  const proteinG = useNativeState(initialNumber(initialValues.proteinG));
  const saltG = useNativeState(initialNumber(initialValues.saltG));
  const sodiumMg = useNativeState(initialNumber(initialValues.sodiumMg));
  const [basisUnit, setBasisUnit] = useState<ProductInput['basisUnit']>(
    initialValues.basisUnit ?? 'g'
  );
  const [servingUnit, setServingUnit] = useState<ProductInput['servingUnit']>(
    initialValues.servingUnit ?? 'g'
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const numericStates = {
    basisAmount,
    servingAmount,
    energyKj,
    energyKcal,
    fatG,
    saturatedFatG,
    carbohydratesG,
    sugarsG,
    fibreG,
    proteinG,
    saltG,
    sodiumMg,
  };

  const handleSubmit = async () => {
    const trimmedCode = code.get().trim();
    const trimmedName = name.get().trim();

    if (!trimmedCode || !trimmedName) {
      setError('Code and product name are required.');
      return;
    }

    const numbers = Object.fromEntries(
      numberFields.map(([field]) => [
        field,
        parseNumber(numericStates[field].get()),
      ])
    ) as Record<NumberField, number | null>;
    const missingField = numberFields.find(
      ([field]) => numbers[field] === null
    );

    if (missingField) {
      setError(`${missingField[1]} must be a non-negative number.`);
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      await onSubmit({
        code: trimmedCode,
        name: trimmedName,
        basisUnit,
        servingUnit,
        ...(numbers as Record<NumberField, number>),
      });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not save product.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section title="Product">
          <TextField text={code} placeholder="Barcode" />
          <TextField text={name} placeholder="Product name" />
        </Section>

        <Section title="Nutrition basis">
          <TextField
            text={basisAmount}
            placeholder="Basis amount"
            modifiers={[keyboardType('decimal-pad')]}
          />
          <Picker
            label="Basis unit"
            selection={basisUnit}
            onSelectionChange={setBasisUnit}
            modifiers={[pickerStyle('menu')]}
          >
            {(['g', 'ml', 'serving'] as const).map((unit) => (
              <Text key={unit} modifiers={[tag(unit)]}>
                {unit}
              </Text>
            ))}
          </Picker>
          <TextField
            text={servingAmount}
            placeholder="Serving amount"
            modifiers={[keyboardType('decimal-pad')]}
          />
          <Picker
            label="Serving unit"
            selection={servingUnit}
            onSelectionChange={setServingUnit}
            modifiers={[pickerStyle('menu')]}
          >
            {(['g', 'ml'] as const).map((unit) => (
              <Text key={unit} modifiers={[tag(unit)]}>
                {unit}
              </Text>
            ))}
          </Picker>
        </Section>

        <Section title="Nutrition values">
          {numberFields.slice(2).map(([field, label]) => (
            <LabeledContent key={field} label={label}>
              <TextField
                text={numericStates[field]}
                placeholder="0"
                modifiers={[keyboardType('decimal-pad')]}
              />
            </LabeledContent>
          ))}
        </Section>

        {error ? (
          <Section title="Please check the form">
            <Text>{error}</Text>
          </Section>
        ) : null}

        <Section>
          <Button
            label={isSaving ? 'Saving…' : submitLabel}
            onPress={handleSubmit}
            modifiers={[buttonStyle('borderedProminent'), disabled(isSaving)]}
          />
        </Section>
      </Form>
    </Host>
  );
}
